import { decisionTreeUrlClassifier } from "./decisionTree";
import { extractUrlFeatures } from "./urlFeaturesExtractor";
import {DOMFeatures} from "./domFeaturesExtractor";

export function isPhishingSite(url: string, domFeatures: DOMFeatures): boolean {
    const isDOMPhishing = detectPhishingFromDOM(domFeatures);
    const isURLPhishing = urlTypePredict(url);
    console.log(`DOM phishing check: ${isDOMPhishing}, URL phishing check: ${isURLPhishing}`);
    return isDOMPhishing && isURLPhishing;
}
  
function urlTypePredict(url: string): boolean {
    const urlFeatures = extractUrlFeatures(url);
    return decisionTreeUrlClassifier.predict(urlFeatures) === 1; // 1 indicates phishing
}

export function detectPhishingFromDOM(domFeatures: DOMFeatures): boolean {
    // Placeholder for logic or model
    // E.g., simple threshold rule or lightweight classifier
    if (domFeatures.iframes > 2 || domFeatures.suspiciousAttrs > 1) {
        return true; // likely phishing
    }
    return false;
}