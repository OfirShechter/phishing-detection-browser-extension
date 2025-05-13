import { chromium } from 'playwright';
import fs from 'fs/promises';
import { PhishingStatus } from '../src/types/state.type';
import { ConfusionMatrix } from 'ml-confusion-matrix';
import {writeFileSync} from "node:fs";
import { plot, PlotData } from 'nodeplotlib';
import * as fsSync from 'fs';
import { parse } from 'csv-parse/sync';

const phishingStatusText: Record<PhishingStatus, string> = {
  [PhishingStatus.PHISHING]: '⚠️ This site may be a phishing attempt!',
  [PhishingStatus.LEGITIMATE]: '✅ This site looks safe.',
  [PhishingStatus.PROCESSING]: '🔄 Checking...',
  [PhishingStatus.EXTENSION_INITIALIZING]: '🔄 Initializing Extension',
  [PhishingStatus.ERROR]: '❗ An error occurred while checking the site.',
};


const EXTENSION_PATH: string = "C:/Users/ofir1/Msc/phishing-detection-browser-extension/phishing-extension/dist";
const csvFilePath = "Data/openphish_enriched.csv";
const csvContent = fsSync.readFileSync(csvFilePath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

(async () => {
  const userDataDir = "playwright-profile"; // must be persistent
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
  // console.log('Browser launched. Waiting for manual configuration...');
  // await page.pause(); // Opens Playwright Inspector and pauses execution
  
  // get extention id
  let [background] = context.serviceWorkers();
  if (!background)
    background = await context.waitForEvent('serviceworker');

  const extensionId = background.url().split('/')[2];
  console.log('Extension ID:', extensionId);
  // const urls = [
  //   { url: 'https://google.com', type: 'legitimate' },
  //   { url: 'https://www.bbc.com/', type: 'legitimate' },
  //   { url: 'https://sso--ndax-io---view-app---cdn.webflow.io/', type: 'phishing' },
  // ];
  const urls = records.map((r: any) => ({ url: r.url, type: r.type })).slice(0, 300);


  let phishingCount = 0;
  let legitimateCount = 0;
  const trueLabels: string[] = [];
  const predictedLabels: string[] = [];
  const timesTaken: number[] = []; 

  // Open popup manually via chrome-extension://
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'domcontentloaded' });

  for (const { url, type } of urls) {
    let result: string | null = '';
    let timeTaken = 0;
    let predictedLabel = 'unknown';
    console.log(`Testing: ${url} [expected: ${type}]`);
    try {
      await page.goto('about:blank', { waitUntil: 'load', timeout: 15000 });
      // Wait a moment to reset the page
      await new Promise((r) => setTimeout(r, 10));

      await page.goto(url, { waitUntil: 'load', timeout: 15000 });

      // Wait for extension logic to finish
      const startTime = Date.now(); // Start timing

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
      timeTaken = endTime - startTime;

      if (result === phishingStatusText[PhishingStatus.PHISHING] || result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
        console.log(`Result: ${result}`);
        console.log(`Time taken: ${endTime - startTime}ms`);
      } else {
        console.error(`Timeout reached (${timeout}ms) without getting a valid result.`);
      }

      if (result === phishingStatusText[PhishingStatus.PHISHING]) {
        phishingCount++;
        predictedLabel = 'phishing';
      } else if (result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
        legitimateCount++;
        predictedLabel = 'legitimate';
      }

      if (result === phishingStatusText[PhishingStatus.PHISHING]) {
        phishingCount++;
      }
      else if (result === phishingStatusText[PhishingStatus.LEGITIMATE]) {
        legitimateCount++;
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error.message);
      // predictedLabel will remain "unknown"
    }

    trueLabels.push(type);
    timesTaken.push(timeTaken);
    predictedLabels.push(predictedLabel);
  }
  // await popupPage.pause();
  await popupPage.close();

  const filteredIndices = predictedLabels.map((label, idx) => label !== 'unknown' ? idx : -1).filter(idx => idx !== -1);
  const filteredTrue = filteredIndices.map(idx => trueLabels[idx]);
  const filteredPred = filteredIndices.map(idx => predictedLabels[idx]);

  const confusionMatrix = ConfusionMatrix.fromLabels(filteredTrue, filteredPred);
  const raw = confusionMatrix.getMatrix();
  console.log('Confusion Matrix:\n', confusionMatrix);
  console.log('Accuracy:', confusionMatrix.getAccuracy().toFixed(2));

  const averageTime = timesTaken.reduce((a, b) => a + b, 0) / timesTaken.length;
  console.log(`Average Response Time: ${averageTime.toFixed(2)}ms`);

  const timeStats = {
    min: Math.min(...timesTaken),
    max: Math.max(...timesTaken),
    mean: averageTime,
  };

  const detailedResults = urls.map((record, idx) => ({
    url: record.url,
    trueLabel: trueLabels[idx],
    predictedLabel: predictedLabels[idx],
    timeTakenMs: timesTaken[idx],
  }));

  writeFileSync('Data/results.json', JSON.stringify({
    confusionMatrix: confusionMatrix.getMatrix(),
    accuracy: confusionMatrix.getAccuracy(),
    timeStats,
    detailedResults,
  }, null, 2));

  await context.close();

  const accuracy = confusionMatrix.getAccuracy();
  const precision = confusionMatrix.getPositivePredictiveValue('phishing');
  const recall = confusionMatrix.getTruePositiveRate('phishing');
  const f1 = (2 * precision * recall) / (precision + recall);

  console.log('📊 Evaluation Metrics for "phishing" class:');
  console.log('------------------------------------------');
  console.log(` Time.     : ${averageTime}ms`);
  console.log(` Accuracy  : ${(accuracy * 100).toFixed(2)}%`);
  console.log(` Precision : ${(precision * 100).toFixed(2)}%`);
  console.log(` Recall    : ${(recall * 100).toFixed(2)}%`);
  console.log(` F1 Score  : ${(f1 * 100).toFixed(2)}%`);

  const heatmapData = {
    z: raw,
    x: ['legitimate', 'phishing'], // Predicted
    y: ['legitimate', 'phishing'], // Actual
    type: 'heatmap' as const,
    colorscale: 'Blues',
    showscale: true,
    hoverongaps: false,
    text: raw.flat().map(val => val.toLocaleString()),
    hoverinfo: 'text' as const,
  };

  const layout = {
    title: 'Confusion Matrix',
    xaxis: { title: 'Predicted' },
    yaxis: { title: 'Actual' },
  };

  plot([heatmapData], layout);


  console.log(`Detected ${phishingCount}/${urls.length} as phishing.`);
  console.log(`Detected ${legitimateCount}/${urls.length} as legitimate.`);
})();
