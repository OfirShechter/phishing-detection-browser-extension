import {fullDecisionTreeClassifier, logregClassifier} from "./decisionTree.ts";

export function isPhishingSiteCombined(urlFeatures: number[], domFeatures: number[]): boolean {
    const start = performance.now();
    const features = [1, ...domFeatures, ...urlFeatures]; // Prepend 1 for the intercept term
    const isPhishing = fullDecisionTreeClassifier.predict(features);
    const duration = performance.now() - start;
    console.log(`Phishing combined check: ${isPhishing} (took ${duration.toFixed(1)} ms). features_vector: ${features}`);
    return isPhishing === 1;
}

export function isPhishingSite(urlFeatures: number[], domFeatures: number[]): boolean {
    const urlStart = performance.now();
    let isPhishing = logregClassifier.predict(urlFeatures);
    const urlDuration = performance.now() - urlStart;
    console.log(`URL Phishing check: ${isPhishing} (took ${urlDuration.toFixed(1)} ms). features_vector: ${urlFeatures}`);
    if (isPhishing == 0) { // prob < 0.5
        const domStart = performance.now();
        const domPrediction = fullDecisionTreeClassifier.predict(domFeatures);
        const domDuration = performance.now() - domStart;
        isPhishing = domPrediction;
        console.log(`DOM Phishing check: ${domPrediction} (took ${domDuration.toFixed(1)} ms). features_vector: ${domFeatures}`);
    }
    return isPhishing === 1;
}