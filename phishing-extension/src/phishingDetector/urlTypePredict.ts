import { extractFeatures } from "./tfidf";
import { SparseVector } from "./types.phishingDetector";
import modelDataJson from "../model/logistic_regression_model.json";

type LogisticRegressionData = {
    coef: number[];
    intercept: number;
}

let modelData: LogisticRegressionData = modelDataJson as LogisticRegressionData; // Initialize with the JSON data

function sparseDotProduct(sparseVec: SparseVector, weights: number[]): number {
    let dot = 0;
    for (const i in sparseVec) {
      dot += sparseVec[i] * weights[+i];
    }
    return dot;
  }
  
// export async function loadModelData(): Promise<void> {
//     if (!modelData) {
//         const response = await fetch('/model/logistic_regression_model.json');
//         modelData = await response.json();
//     }
// }

export function urlTypePredict(url: string): boolean {
    // if (!modelData) {
    //     throw new Error("Model data not loaded. Call initialize() first.");
    // }

    const features = extractFeatures(url);

    // Logistic Regression Calculation
    const dot = sparseDotProduct(features, modelData.coef);
    const z = dot + modelData.intercept;
    const sigmoid = 1 / (1 + Math.exp(-z));

    return sigmoid > 0.5; // Return true for phishing, false for legitimate
}