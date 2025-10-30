// backend/config/puppeteer.js

/**
 * Puppeteer configuration cho các môi trường khác nhau
 */
const getPuppeteerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDocker = process.env.IS_DOCKER === 'true';

  // Base config
  const config = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    timeout: 30000
  };

  // Production optimizations
  if (isProduction) {
    config.args.push(
      '--no-first-run',
      '--no-zygote',
      '--disable-features=VizDisplayCompositor'
    );
  }

  // Docker specific
  if (isDocker) {
    config.args.push(
      '--disable-software-rasterizer',
      '--disable-web-security'
    );
    config.executablePath = '/usr/bin/chromium-browser'; // Path trong Docker
  }

  return config;
};

/**
 * PDF options chuẩn
 */
const getDefaultPDFOptions = () => ({
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  },
  preferCSSPageSize: true,
  displayHeaderFooter: false
});

module.exports = {
  getPuppeteerConfig,
  getDefaultPDFOptions
};