import { extractFeatures } from "./tfidf";

import modelDataJson from '../../public/model/logistic_regression_model.json';

const modelData = modelDataJson as LogisticRegressionData
export function urlTypePredict(url: string): boolean {
    const features = extractFeatures(url);
    const weights = modelData.coef as number[];
    const intercept = modelData.intercept as number;
  
    const dot = features.reduce((sum, f, i) => sum + f * weights[i], 0);
    const z = dot + intercept;
    const sigmoid = 1 / (1 + Math.exp(-z));
    return sigmoid > 0.5; // Return true for phishing, false for legitimate
  }