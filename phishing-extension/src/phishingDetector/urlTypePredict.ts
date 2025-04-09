import { extractFeatures } from "./tfidf";

let modelData: LogisticRegressionData | null = null;

export async function loadModelData(): Promise<void> {
    if (!modelData) {
        const response = await fetch('/model/logistic_regression_model.json');
        modelData = await response.json();
    }
}

export function urlTypePredict(url: string): boolean {
    if (!modelData) {
        throw new Error("Model data not loaded. Call initialize() first.");
    }

    const features = extractFeatures(url);
    const weights = modelData.coef;
    const intercept = modelData.intercept;

    const dot = features.reduce((sum, f, i) => sum + f * weights[i], 0);
    const z = dot + intercept;
    const sigmoid = 1 / (1 + Math.exp(-z));
    return sigmoid > 0.5; // Return true for phishing, false for legitimate
}