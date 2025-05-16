import {htmlDecisionTreeClassifier} from "./decisionTree.ts";
import { logregClassifier } from "./logisticRegression.ts";

export function isPhishingSite(urlFeatures: number[], domFeatures: number[] | null | undefined): number {
    // const urlStart = performance.now();
    let isPhishing = logregClassifier.predictProb(urlFeatures);
    // const urlDuration = performance.now() - urlStart;
    // console.log(`URL Phishing check: ${isPhishing} (took ${urlDuration.toFixed(1)} ms). features_vector: ${urlFeatures}`);
    if (isPhishing < 0.06) {
        return 0;
    }
    if (domFeatures != null && isPhishing < 0.5) {
        // const domStart = performance.now();
        const domPrediction = htmlDecisionTreeClassifier.predict(domFeatures);
        // const domDuration = performance.now() - domStart;
        isPhishing = domPrediction;
        // console.log(`DOM Phishing check: ${domPrediction} (took ${domDuration.toFixed(1)} ms). features_vector: ${domFeatures}`);
    }
    return isPhishing;
}