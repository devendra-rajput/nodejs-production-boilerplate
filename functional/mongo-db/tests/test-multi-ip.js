const http = require('http');

class MultiIPRateLimiterTester {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.stats = {
      successful: 0,
      blocked: 0,
      errors: 0,
      total: 0,
      byIP: new Map(),
    };
  }

  generateFakeIP(userId) {
    const segments = [
      `192.168.${Math.floor(userId / 255) + 1}.${(userId % 254) + 1}`,
      `10.0.${Math.floor(userId / 255) + 1}.${(userId % 254) + 1}`,
      `172.16.${Math.floor(userId / 255) + 1}.${(userId % 254) + 1}`,
    ];
    return segments[userId % 3];
  }

  makeRequestWithIP(ip, endpoint = '/load-test') {
    return new Promise((resolve) => {
      const url = new URL(endpoint, this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 8000,
        path: url.pathname,
        method: 'GET',
        timeout: 3000,
        headers: {
          'X-Forwarded-For': ip,
          'X-Real-IP': ip,
        },
      };

      const startTime = Date.now();
      const req = http.request(options, (res) => {
        // Consume response data to ensure 'end' event fires
        res.resume();

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            duration: Date.now() - startTime,
            ip,
            success: res.statusCode === 200,
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 0,
          duration: Date.now() - startTime,
          ip,
          error: error.message,
          success: false,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 0,
          duration: Date.now() - startTime,
          ip,
          error: 'Timeout',
          success: false,
        });
      });

      req.end();
    });
  }

  async testMultipleUsers(userCount = 10, requestsPerUser = 25) {
    console.log(`🧪 Testing ${userCount} users with ${requestsPerUser} requests each\n`);

    const allPromises = [];
    const totalRequests = userCount * requestsPerUser;
    let completed = 0;

    // Progress indicator
    const progressInterval = setInterval(() => {
      const percent = ((completed / totalRequests) * 100).toFixed(1);
      process.stdout.write(`\r📨 Progress: ${completed}/${totalRequests} (${percent}%)`);
    }, 100);

    for (let userId = 1; userId <= userCount; userId += 1) {
      const userIP = this.generateFakeIP(userId);

      if (!this.stats.byIP.has(userIP)) {
        this.stats.byIP.set(userIP, { successful: 0, blocked: 0, errors: 0 });
      }

      for (let requestNum = 1; requestNum <= requestsPerUser; requestNum += 1) {
        // eslint-disable-next-line no-loop-func
        const promise = this.makeRequestWithIP(userIP).then((result) => {
          completed += 1;

          // Update global stats
          this.stats.total += 1;
          if (result.statusCode === 200) {
            this.stats.successful += 1;
            this.stats.byIP.get(userIP).successful += 1;
          } else if (result.statusCode === 429) {
            this.stats.blocked += 1;
            this.stats.byIP.get(userIP).blocked += 1;
          } else {
            this.stats.errors += 1;
            this.stats.byIP.get(userIP).errors += 1;
          }

          return result;
        });

        allPromises.push(promise);

        // Small delay to avoid connection limits
        if (allPromises.length % 50 === 0) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => { setTimeout(resolve, 50); });
        }
      }
    }

    await Promise.all(allPromises);
    clearInterval(progressInterval);

    this.printMultiIPReport();
    return this.stats;
  }

  printMultiIPReport() {
    console.log('\n\n📈 ===== MULTI-IP TEST RESULTS =====');
    console.log(`👥 Users Simulated: ${this.stats.byIP.size}`);
    console.log(`📨 Total Requests: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.successful}`);
    console.log(`🚫 Rate Limited: ${this.stats.blocked}`);
    console.log(`❌ Errors: ${this.stats.errors}`);

    console.log('\n📊 Per-IP Breakdown:');
    this.stats.byIP.forEach((stats, ip) => {
      console.log(`   ${ip}: ✅ ${stats.successful} 🚫 ${stats.blocked} ❌ ${stats.errors}`);
    });

    // Validate rate limiter per IP
    let allIPsLimited = true;
    this.stats.byIP.forEach((stats, ip) => {
      if (stats.successful > 200) { // Should be limited to 200 per second
        console.log(`⚠️  IP ${ip} may not be properly limited (${stats.successful} successes)`);
        allIPsLimited = false;
      }
    });

    if (allIPsLimited) {
      console.log('🎉 Rate limiter is correctly limiting per IP!');
    }
  }
}

// Run the test
if (require.main === module) {
  const args = process.argv.slice(2);
  let baseUrl = 'http://localhost:8000';
  let userCount = 10;
  let requestsPerUser = 25;

  // Parse arguments
  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    baseUrl = args[baseUrlIndex + 1];
    console.log(`Using Base URL: ${baseUrl}`);
  }

  const usersIndex = args.indexOf('--users');
  if (usersIndex !== -1 && args[usersIndex + 1]) {
    userCount = parseInt(args[usersIndex + 1], 10);
  }

  const requestsIndex = args.indexOf('--requests');
  if (requestsIndex !== -1 && args[requestsIndex + 1]) {
    requestsPerUser = parseInt(args[requestsIndex + 1], 10);
  }

  const tester = new MultiIPRateLimiterTester(baseUrl);
  tester.testMultipleUsers(userCount, requestsPerUser).catch(console.error);
}

module.exports = MultiIPRateLimiterTester;
