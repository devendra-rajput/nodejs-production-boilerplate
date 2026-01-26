const http = require('http');
const https = require('https');

/**
 * RateLimiterTester - Tests rate limiting functionality
 */
class RateLimiterTester {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.stats = {
      successful: 0,
      blocked: 0,
      errors: 0,
      total: 0,
    };
  }

  /**
   * Make a single HTTP request
   */
  makeRequest(endpoint = '/load-test') {
    return new Promise((resolve) => {
      const url = new URL(endpoint, this.baseUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        timeout: 3000,
      };

      const startTime = Date.now();
      const req = protocol.request(options, (res) => {
        // Consume response data to ensure 'end' event fires
        res.resume();

        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            duration,
            // data,
            success: res.statusCode === 200,
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 0,
          duration: Date.now() - startTime,
          error: error.message,
          success: false,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 0,
          duration: Date.now() - startTime,
          error: 'Timeout',
          success: false,
        });
      });

      req.end();
    });
  }

  /**
   * Run the rate limit test
   */
  async testRateLimit(requestsPerSecond = 250, durationSeconds = 5) {
    console.log('🚀 Starting rate limiter test...');
    console.log(`📊 Target: ${requestsPerSecond} requests/second for ${durationSeconds} seconds\n`);

    // const totalRequests = requestsPerSecond * durationSeconds;
    const results = [];

    for (let second = 0; second < durationSeconds; second += 1) {
      console.log(`\n⏰ Second ${second + 1}: Sending ${requestsPerSecond} requests...`);

      const secondPromises = [];
      const batchSize = 50; // Process in batches to avoid too many concurrent connections

      for (let i = 0; i < requestsPerSecond; i += 1) {
        const requestIndex = (second * requestsPerSecond) + i + 1;

        // Add small delay between batches
        if (i % batchSize === 0) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => { setTimeout(resolve, 10); });
        }

        secondPromises.push(
          this.makeRequest().then((result) => ({ ...result, requestIndex })),
        );
      }

      // eslint-disable-next-line no-await-in-loop
      const secondResults = await Promise.all(secondPromises);
      results.push(...secondResults);

      // Update stats
      secondResults.forEach((result) => {
        this.stats.total += 1;
        if (result.statusCode === 200) {
          this.stats.successful += 1;
        } else if (result.statusCode === 429) {
          this.stats.blocked += 1;
        } else {
          this.stats.errors += 1;
        }
      });

      // Log progress for this second
      const secondStats = secondResults.reduce((acc, result) => {
        if (result.statusCode === 200) {
          acc.successful += 1;
        } else if (result.statusCode === 429) {
          acc.blocked += 1;
        } else {
          acc.errors += 1;
        }
        return acc;
      }, { successful: 0, blocked: 0, errors: 0 });

      console.log(`   ✅ ${secondStats.successful} successful, 🚫 ${secondStats.blocked} blocked, ❌ ${secondStats.errors} errors`);

      // Wait for next second if not the last iteration
      if (second < durationSeconds - 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 1000); });
      }
    }

    this.printFinalReport();
    return this.stats;
  }

  /**
   * Print final test report
   */
  printFinalReport() {
    console.log('\n📈 ===== FINAL TEST RESULTS =====');
    console.log(`✅ Successful Requests: ${this.stats.successful}`);
    console.log(`🚫 Rate Limited (429): ${this.stats.blocked}`);
    console.log(`❌ Other Errors: ${this.stats.errors}`);
    console.log(`📊 Total Requests: ${this.stats.total}`);
    console.log(`🎯 Success Rate: ${((this.stats.successful / this.stats.total) * 100).toFixed(2)}%`);

    // Rate limiter validation
    const expectedMaxSuccess = 200 * 5; // 200/sec for 5 seconds
    if (this.stats.successful <= expectedMaxSuccess && this.stats.blocked > 0) {
      console.log('🎉 Rate limiter is working correctly!');
    } else {
      console.log('⚠️  Rate limiter may not be working as expected');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  let baseUrl = 'http://localhost:8000';
  let rps = 250; // Requests per second
  let duration = 5; // Duration in seconds

  // Parse arguments
  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    baseUrl = args[baseUrlIndex + 1];
    console.log(`Using Base URL: ${baseUrl}`);
  }

  const rpsIndex = args.indexOf('--rps');
  if (rpsIndex !== -1 && args[rpsIndex + 1]) {
    rps = parseInt(args[rpsIndex + 1], 10);
  }

  const durationIndex = args.indexOf('--duration');
  if (durationIndex !== -1 && args[durationIndex + 1]) {
    duration = parseInt(args[durationIndex + 1], 10);
  }

  const tester = new RateLimiterTester(baseUrl);
  tester.testRateLimit(rps, duration).catch(console.error);
}

module.exports = RateLimiterTester;
