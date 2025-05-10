import {extractUrlFeatures} from "./urlFeaturesExtractor";
import { logRegUrlClassifier } from "./logisticRegression.ts";
import { htmlDecisionTreeClassifier, fullDecisionTreeClassifier } from "./decisionTree.ts";

function domTypePredict(domFeatures: number[]): boolean {
    const start = performance.now();
    const isPhishing = htmlDecisionTreeClassifier.predict(domFeatures);
    const duration = performance.now() - start;
    console.log(`DOM phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms)`);
    return isPhishing === 1;
}

export function isSiteLegitimateByUrl(url: string, signal: AbortSignal): boolean {
    signal.addEventListener("abort", () => {
        return false; // If the signal is aborted, return false (indicating uncertainty about legitimacy)
    }, { once: true }); // Ensure the event listener is removed after the first invocation

    const start = performance.now();
    const urlFeatures = extractUrlFeatures(url);
    const isLegitimate = logRegUrlClassifier.predict(urlFeatures); // Return true if Legitimate in very high probebility
    const duration = performance.now() - start;
    console.log(`URL legitimacy check: ${isLegitimate} (took ${duration.toFixed(1)} ms),  features_vector: ${urlFeatures}`);
    return isLegitimate;
}

export function isPhishingSiteByDom(domFeatures: number[]): boolean {
    const start = performance.now();
    const isPhishing = domTypePredict(domFeatures);
    const duration = performance.now() - start;
    console.log(`DOM phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms),  features_vector: ${domFeatures}`);
    return isPhishing;
}

export function isPhishingSite(url: string, domFeatures: number[]): boolean {
    const start = performance.now();
    const urlFeatures = extractUrlFeatures(url);
    const features = [1, ...domFeatures, ...urlFeatures]; // Prepend 1 for the intercept term
    const isPhishing = fullDecisionTreeClassifier.predict(features);
    const duration = performance.now() - start;
    console.log(`Phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms). features_vector: ${features}`);
    return isPhishing === 1;
}