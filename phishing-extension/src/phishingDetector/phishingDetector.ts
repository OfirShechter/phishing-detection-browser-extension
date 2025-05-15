import {htmlDecisionTreeClassifier} from "./decisionTree.ts";
import { logregClassifier } from "./logisticRegression.ts";

// export function isPhishingSiteCombined(urlFeatures: number[], domFeatures: number[]): number {
//     const start = performance.now();
//     const features = [1, ...domFeatures, ...urlFeatures]; // Prepend 1 for the intercept term
//     const isPhishing = fullDecisionTreeClassifier.predict(features);
//     const duration = performance.now() - start;
//     console.log(`Phishing combined check: ${isPhishing} (took ${duration.toFixed(1)} ms). features_vector: ${features}`);
//     return isPhishing;
// }

export function isPhishingSite(urlFeatures: number[], domFeatures: number[] | null | undefined): boolean {
    const urlStart = performance.now();
    let isPhishing = logregClassifier.predictProb(urlFeatures);
    const urlDuration = performance.now() - urlStart;
    console.log(`URL Phishing check: ${isPhishing} (took ${urlDuration.toFixed(1)} ms). features_vector: ${urlFeatures}`);
    if (domFeatures != null && isPhishing < 0.5) {
        // isPhishing = isPhishingSiteCombined(urlFeatures, domFeatures);
        const domStart = performance.now();
        const domPrediction = htmlDecisionTreeClassifier.predict(domFeatures);
        const domDuration = performance.now() - domStart;
        isPhishing = domPrediction;
        console.log(`DOM Phishing check: ${domPrediction} (took ${domDuration.toFixed(1)} ms). features_vector: ${domFeatures}`);
    }
    return isPhishing >= 0.5;
}