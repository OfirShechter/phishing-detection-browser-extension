import { isPhishingSite } from "../src/phishingDetector/phishingDetector";
import { extractDOMFeatures } from "../src/phishingDetector/domFeaturesExtractor";
import { extractUrlFeatures } from "../src/phishingDetector/urlFeaturesExtractor";

async function fetchUrlsFromOpenPhish() {
  try {
    const response = await fetch("https://openphish.com/feed.txt");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const urls = text.split("\n").filter((url) => url.trim() !== "");
    return urls
  } catch (error) {
    console.error("Failed to fetch URLs from OpenPhish:", error);
    return [];
  }
}


async function checkPhishingUrls() {
  let phishingCount = 0;

  const urls = (await fetchUrlsFromOpenPhish()).splice(0, 2); // Limit to 10 URLs for testing

  for (const url of urls) {
    console.log(`Checking URL: ${url}`);
    try {
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
