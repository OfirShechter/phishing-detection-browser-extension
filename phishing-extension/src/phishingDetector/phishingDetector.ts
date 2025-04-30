import { decisionTreeUrlClassifier } from "./decisionTree";
import { extractUrlFeatures } from "./urlFeaturesExtractor";
import { DOMFeatures } from "./domFeaturesExtractor";
import {predictDOMPhishing} from "./domPredictor.ts";

function urlTypePredict(url: string): boolean {
    const start = performance.now();
    const urlFeatures = extractUrlFeatures(url);
    const isPhishing = decisionTreeUrlClassifier.predict(urlFeatures) === 1;
    const duration = performance.now() - start;
    console.log(`URL phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms)`);
    return isPhishing;
}

export function detectPhishingFromDOM(domFeatures: DOMFeatures): boolean {
    const start = performance.now();
    const result = predictDOMPhishing(domFeatures);
    const duration = performance.now() - start;
    console.log(`DOM phishing check: ${result} (took ${duration.toFixed(1)} ms)`);
    return result;
}

export function isPhishingSite(url: string, domFeatures: DOMFeatures): boolean {
    const isDOMPhishing = detectPhishingFromDOM(domFeatures);
    const isURLPhishing = urlTypePredict(url); // must be sync!

    const result = isDOMPhishing && isURLPhishing;
    console.log(`Final phishing verdict: ${result}`);
    return result;
}