import { chromium } from 'playwright';
import fs from 'fs/promises';
import { PhishingStatus } from '../src/types/state.type';

const phishingStatusText: Record<PhishingStatus, string> = {
  [PhishingStatus.PHISHING]: '⚠️ This site may be a phishing attempt!',
  [PhishingStatus.LEGITIMATE]: '✅ This site looks safe.',
  [PhishingStatus.PROCESSING]: '🔄 Checking...',
  [PhishingStatus.EXTENSION_INITIALIZING]: '🔄 Initializing Extension',
  [PhishingStatus.ERROR]: '❗ An error occurred while checking the site.',
};

const EXTENSION_PATH: string = 'C:\\Users\\ofir1\\Msc\\phishing-detection-browser-extension\\phishing-extension\\dist';


(async () => {
  const userDataDir = 'C:\\Users\\ofir1\\Msc\\phishing-detection-browser-extension\\playwright\\playwright-profile'; // must be persistent
  // create userDataDir if it doesn't exist
  try {
    await fs.mkdir(userDataDir, { recursive: true });
  } catch (error) {
    console.error('Error creating userDataDir:', error);
  }
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  const page = await context.newPage();

  // Wait a moment to allow extension to load
  await new Promise((r) => setTimeout(r, 3000));

  // Wait for the extension to load
  console.log('Browser launched. Waiting for manual configuration...');
  // await page.pause(); // Opens Playwright Inspector and pauses execution
  
  // get extention id
  let [background] = context.serviceWorkers();
  if (!background)
    background = await context.waitForEvent('serviceworker');

  const extensionId = background.url().split('/')[2];

  const urls = [
    'https://google.com',
  ];

  let phishingCount = 0;
  let legitimateCount = 0;
  for (const url of urls) {
    console.log(`Testing: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Open popup manually via chrome-extension://
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for extension logic to finish
    const startTime = Date.now(); // Start timing

    let result: string | null = '';
    const timeout = 1000; // Timeout in milliseconds
    const pollingInterval = 10; // Polling interval in milliseconds

    const start = Date.now();
    while (Date.now() - start < timeout) {
      result = await popupPage.textContent('#phishing-status');
      console.log('Current status: %s', result);
      if (result === phishingStatusText[PhishingStatus.PHISHING] || result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
        break; // Exit the loop if the result is either phishing or legitimate
      }
      await new Promise((resolve) => setTimeout(resolve, pollingInterval)); // Wait before polling again
    }

    const endTime = Date.now(); // End timing

    if (result === phishingStatusText[PhishingStatus.PHISHING] || result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
      console.log(`Result: ${result}`);
      console.log(`Time taken: ${endTime - startTime}ms`);
    } else {
      console.error(`Timeout reached (${timeout}ms) without getting a valid result.`);
    }

    // wait with timeout for popupPage.textContent('#phishing-status') to be either phishing or legitimate

    if (result === phishingStatusText[PhishingStatus.PHISHING]) {
      phishingCount++;
    }
    else if (result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
      legitimateCount++;
    }
    await popupPage.pause();
    await popupPage.close();
  }
  await context.close();

  console.log(`Detected ${phishingCount}/${urls.length} as phishing.`);
})();
