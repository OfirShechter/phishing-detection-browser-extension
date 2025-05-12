import { isPhishingSite } from "../src/phishingDetector/phishingDetector";
import { extractDOMFeatures } from "../src/phishingDetector/domFeaturesExtractor";
import { extractUrlFeatures } from "../src/phishingDetector/urlFeaturesExtractor";

const urls = [
  "https://example.com", // Replace with your list of URLs
  "https://phishing-site.com",
  "https://legitimate-site.com",
];

async function checkPhishingUrls() {
  let phishingCount = 0;

  for (const url of urls) {
    try {
      console.log(`Checking URL: ${url}`);
      const response = await fetch(url);
      const html = await response.text();

      const domFeatures = extractDOMFeatures(html, new URL(url).hostname);
      const urlFeatures = extractUrlFeatures(url);

      const isPhishing = isPhishingSite(urlFeatures, domFeatures);
      console.log(`Result for ${url}: ${isPhishing ? "Phishing" : "Legitimate"}`);

      if (isPhishing) {
        phishingCount++;
      }
    } catch (error) {
      console.error(`Failed to check URL ${url}:`, error);
    }
  }

  const phishingPercentage = (phishingCount / urls.length) * 100;
  console.log(`Phishing Percentage: ${phishingPercentage.toFixed(2)}%`);
}

checkPhishingUrls();
