import {extractUrlFeatures} from "./urlFeaturesExtractor";
import {DOMFeatures} from "./domFeaturesExtractor";
import {predictDOMPhishing} from "./domPredictor.ts";
import { logRegUrlClassifier } from "./logisticRegression.ts";

// Will return false only if the probebility of legitimacy is above 0.91! 
function urlTypePredict(url: string): boolean {
    const start = performance.now();
    const urlFeatures = extractUrlFeatures(url);
    const isPhishing = logRegUrlClassifier.predict(urlFeatures);
    const duration = performance.now() - start;
    console.log(`URL phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms)`);
    return isPhishing;
}

export function detectPhishingFromDOM(domFeatures: DOMFeatures | null | undefined): boolean {
    const start = performance.now();
    let result;
    if (domFeatures == null) {
        result = true;
    } else {
        result = predictDOMPhishing(domFeatures);
    }
    const duration = performance.now() - start;
    console.log(`DOM phishing check: ${result} (took ${duration.toFixed(1)} ms)`);
    return result;
}

export function isPhishingSite(url: string, domFeatures: DOMFeatures | null | undefined): boolean {
    const isURLPhishing = urlTypePredict(url);
    if (!isURLPhishing) {
        return false; // If URL is not phishing, no need to check DOM, as legitimate sites prediction is only for very high probebility of legitimacy
    }
    const isDOMPhishing = detectPhishingFromDOM(domFeatures);

    return isDOMPhishing && isURLPhishing;
}