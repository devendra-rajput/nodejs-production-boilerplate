/**
 * Rate Limiter Test Utility
 *
 * Tests rate limiting functionality by sending multiple requests.
 * Following functional programming principles:
 * - Pure functions for configuration
 * - Composition for test execution
 * - Immutable statistics tracking
 *
 * Usage:
 *   node tests/test-rate-limiter.js
 *   node tests/test-rate-limiter.js --base-url http://localhost:8000 --rps 250 --duration 5
 *
 * @module tests/test-rate-limiter
 */

const http = require('http');
const https = require('https');

/**
 * Default test configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:8000',
  endpoint: '/load-test',
  requestsPerSecond: 250,
  durationSeconds: 5,
  batchSize: 50,
  batchDelay: 10,
  timeout: 3000,
};

/**
 * Create empty statistics object
 * Pure function that returns initial stats
 *
 * @returns {Object} Empty statistics object
 */
const createEmptyStats = () => ({
  successful: 0,
  blocked: 0,
  errors: 0,
  total: 0,
});

/**
 * Update statistics with result
 * Pure function that returns updated stats
 *
 * @param {Object} stats - Current statistics
 * @param {Object} result - Request result
 * @returns {Object} Updated statistics
 */
const updateStats = (stats, result) => {
  const newStats = { ...stats, total: stats.total + 1 };

  if (result.statusCode === 200) {
    newStats.successful += 1;
  } else if (result.statusCode === 429) {
    newStats.blocked += 1;
  } else {
    newStats.errors += 1;
  }

  return newStats;
};

/**
 * Calculate success rate
 * Pure function that calculates percentage
 *
 * @param {number} successful - Number of successful requests
 * @param {number} total - Total number of requests
 * @returns {string} Success rate percentage
 */
const calculateSuccessRate = (successful, total) => {
  if (total === 0) return '0.00';
  return ((successful / total) * 100).toFixed(2);
};

/**
 * Parse URL
 * Pure function that extracts URL components
 *
 * @param {string} baseUrl - Base URL
 * @param {string} endpoint - Endpoint path
 * @returns {Object} URL components
 */
const parseUrl = (baseUrl, endpoint) => {
  const url = new URL(endpoint, baseUrl);
  return {
    protocol: url.protocol === 'https:' ? https : http,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
  };
};

/**
 * Make HTTP request
 * @param {string} baseUrl - Base URL
 * @param {string} endpoint - Endpoint path
 * @param {number} timeout - Request timeout
 * @returns {Promise<Object>} Request result
 */
const makeRequest = (baseUrl, endpoint, timeout) => new Promise((resolve) => {
  const urlComponents = parseUrl(baseUrl, endpoint);
  const { protocol, ...options } = urlComponents;

  const requestOptions = {
    ...options,
    method: 'GET',
    timeout,
  };

  const startTime = Date.now();
  const req = protocol.request(requestOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      resolve({
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
        data,
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

/**
 * Execute requests with batching
   * @param {number} totalRequests - Total number of requests
   * @param {number} batchSize - Batch size
   * @param {number} batchDelay - Delay between batches
   * @param {Function} requestFn - Request function
   * @returns {Promise<Array>} Array of results
   */
const executeRequestsWithBatching = async (
  totalRequests,
  batchSize,
  batchDelay,
  requestFn,
) => {
  const promises = [];

  for (let i = 0; i < totalRequests; i += 1) {
    // Add small delay between batches
    if (i % batchSize === 0 && i > 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, batchDelay);
      });
    }

    promises.push(
      requestFn().then((result) => ({ ...result, requestIndex: i + 1 })),
    );
  }

  return Promise.all(promises);
};

/**
 * Log second progress
 * @param {number} second - Current second
 * @param {Object} stats - Second statistics
 */
const logSecondProgress = (second, stats) => {
  console.log(`   ✅ ${stats.successful} successful, 🚫 ${stats.blocked} blocked, ❌ ${stats.errors} errors`);
};

/**
 * Print test header
 * @param {Object} config - Test configuration
 */
const printTestHeader = (config) => {
  console.log('🚀 Starting rate limiter test...');
  console.log(`📊 Target: ${config.requestsPerSecond} requests/second for ${config.durationSeconds} seconds\n`);
};

/**
 * Print final report
 * @param {Object} stats - Final statistics
 * @param {number} durationSeconds - Test duration
 */
const printFinalReport = (stats, _durationSeconds) => {
  console.log('\n📈 ===== FINAL TEST RESULTS =====');
  console.log(`✅ Successful Requests: ${stats.successful}`);
  console.log(`🚫 Rate Limited (429): ${stats.blocked}`);
  console.log(`❌ Other Errors: ${stats.errors}`);
  console.log(`📊 Total Requests: ${stats.total}`);
  console.log(`🎯 Success Rate: ${calculateSuccessRate(stats.successful, stats.total)}%`);

  // Validate rate limiter effectiveness
  if (stats.blocked > 0) {
    console.log('🎉 Rate limiter is working correctly!');
  } else {
    console.log('⚠️  Rate limiter may not be working as expected');
  }
};

/**
 * Run rate limiter test
 * @param {Object} config - Test configuration
 * @returns {Promise<Object>} Test statistics
 */
const runRateLimiterTest = async (config) => {
  printTestHeader(config);

  let stats = createEmptyStats();

  // eslint-disable-next-line no-plusplus
  for (let second = 0; second < config.durationSeconds; second++) {
    console.log(`\n⏰ Second ${second + 1}: Sending ${config.requestsPerSecond} requests...`);

    // Create request function
    const requestFn = () => makeRequest(config.baseUrl, config.endpoint, config.timeout);

    // Execute requests with batching
    // eslint-disable-next-line no-await-in-loop
    const results = await executeRequestsWithBatching(
      config.requestsPerSecond,
      config.batchSize,
      config.batchDelay,
      requestFn,
    );

    // Update statistics
    const updatedStats = results.reduce(
      (acc, result) => updateStats(acc, result),
      stats,
    );
    const secondStats = results.reduce(
      (acc, result) => updateStats(acc, result),
      createEmptyStats(),
    );
    stats = updatedStats;

    // Log progress
    logSecondProgress(second + 1, secondStats);

    // Wait for next second if not last iteration
    if (second < config.durationSeconds - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
  }

  printFinalReport(stats, config.durationSeconds);

  return stats;
};

/**
 * Parse command line arguments
 * @returns {Object} Parsed configuration
 */
const parseArguments = () => {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    config.baseUrl = args[baseUrlIndex + 1];
  }

  const rpsIndex = args.indexOf('--rps');
  if (rpsIndex !== -1 && args[rpsIndex + 1]) {
    config.requestsPerSecond = parseInt(args[rpsIndex + 1], 10);
  }

  const durationIndex = args.indexOf('--duration');
  if (durationIndex !== -1 && args[durationIndex + 1]) {
    config.durationSeconds = parseInt(args[durationIndex + 1], 10);
  }

  return config;
};

/**
 * Main test runner
 */
const runTest = async () => {
  try {
    const config = parseArguments();
    await runRateLimiterTest(config);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run test if executed directly
if (require.main === module) {
  runTest();
}

/**
 * Export for testing
 */
module.exports = {
  runRateLimiterTest,
  makeRequest,
  createEmptyStats,
  updateStats,
  calculateSuccessRate,
  DEFAULT_CONFIG,
};
