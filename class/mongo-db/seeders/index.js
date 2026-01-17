const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * SeederRunner - Database Seeder Orchestrator
 *
 * Manages execution of database seed scripts
 * Follows OOP principles:
 * - Encapsulation: Seeder logic in one class
 * - Single Responsibility: Only handles seed execution
 * - Flexibility: Supports serial and parallel execution
 */
class SeederRunner {
  constructor() {
    this.seedFiles = ['admin.js'];
    this.results = [];
  }

  /**
   * Execute a single seed file
   * @private
   */
  async _executeSeedFile(file) {
    console.log(`📦 Running seeder: ${file}...`);

    try {
      const { stdout, stderr } = await execAsync(`node seeders/${file}`);

      if (stderr) {
        console.error(`❌ Error in ${file}:`, stderr);
        return { file, success: false, error: stderr };
      }

      console.log(`✅ ${file} completed:`, stdout.trim());
      return { file, success: true, output: stdout };
    } catch (error) {
      console.error(`❌ Failed to execute ${file}:`, error.message);
      return { file, success: false, error: error.message };
    }
  }

  /**
   * Run seed scripts in series (one after another)
   */
  async runInSeries() {
    console.log('🌱 Starting seeders in series...\n');
    this.results = [];

    try {
      for (let i = 0; i < this.seedFiles.length; i += 1) {
        const file = this.seedFiles[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await this._executeSeedFile(file);
        this.results.push(result);
      }

      this._printSummary('series');
    } catch (error) {
      console.error('❌ Seeder execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Run seed scripts in parallel (all at once)
   */
  async runInParallel() {
    console.log('🌱 Starting seeders in parallel...\n');

    try {
      const promises = this.seedFiles.map((file) => this._executeSeedFile(file));
      this.results = await Promise.all(promises);

      this._printSummary('parallel');
    } catch (error) {
      console.error('❌ Seeder execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Print execution summary
   * @private
   */
  _printSummary(mode) {
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 Seeder Execution Summary');
    console.log('='.repeat(50));
    console.log(`Mode: ${mode}`);
    console.log(`Total: ${this.results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`${'='.repeat(50)}\n`);

    if (failed > 0) {
      console.log('Failed seeders:');
      this.results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.file}: ${r.error}`));
    }
  }

  /**
   * Add seed file to the list
   */
  addSeedFile(file) {
    if (!this.seedFiles.includes(file)) {
      this.seedFiles.push(file);
    }
  }

  /**
   * Get execution results
   */
  getResults() {
    return this.results;
  }
}

// Create instance and run
const seederRunner = new SeederRunner();

// Run in series (default - safer for dependent seeds)
seederRunner.runInSeries()
  .then(() => {
    console.log('✅ All seeders completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeder process failed:', error);
    process.exit(1);
  });

// Uncomment to run in parallel (faster but not suitable for dependent seeds)
// seederRunner.runInParallel();
