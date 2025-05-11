import { fullDecisionTreeClassifier } from "./decisionTree.ts";

export function isPhishingSite(urlFeatures: number[], domFeatures: number[]): boolean {
    const start = performance.now();
    const features = [1, ...domFeatures, ...urlFeatures]; // Prepend 1 for the intercept term
    const isPhishing = fullDecisionTreeClassifier.predict(features);
    const duration = performance.now() - start;
    console.log(`Phishing check: ${isPhishing} (took ${duration.toFixed(1)} ms). features_vector: ${features}`);
    return isPhishing === 1;
}