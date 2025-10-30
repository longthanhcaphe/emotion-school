// backend/services/pdfQueue.js
const puppeteer = require('puppeteer');

/**
 * Browser pool để tái sử dụng browser instances
 * Giảm thời gian launch (từ 2-3s xuống ~100ms)
 */
class BrowserPool {
  constructor() {
    this.browser = null;
    this.isLaunching = false;
  }

  async getBrowser() {
    // Nếu đang launch, đợi
    if (this.isLaunching) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getBrowser();
    }

    // Nếu đã có browser và vẫn connected
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // Launch browser mới
    this.isLaunching = true;
    try {
      console.log('🚀 Launching new browser instance...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      console.log('✅ Browser launched');
    } finally {
      this.isLaunching = false;
    }

    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
const browserPool = new BrowserPool();

// Cleanup khi server shutdown
process.on('SIGINT', async () => {
  console.log('Closing browser pool...');
  await browserPool.close();
  process.exit(0);
});

module.exports = browserPool;