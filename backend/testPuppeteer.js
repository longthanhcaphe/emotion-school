// backend/testPuppeteer.js
const puppeteer = require('puppeteer');

(async () => {
  console.log('Puppeteer version:', puppeteer.version);
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  console.log('Browser launched successfully!');
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const title = await page.title();
  console.log('Page title:', title);
  
  await browser.close();
  console.log('✅ Puppeteer test passed!');
})();