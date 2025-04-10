import { extractFeatures } from "./phishingDetector/tfidf";
import LogisticRegressionModelData from "./model/logistic_regression_model.json";
type LogisticRegressionData = {
    coef: number[];
    intercept: number;
}

let modelData: LogisticRegressionData = LogisticRegressionModelData as LogisticRegressionData; // Initialize with the imported data

console.time("Total Execution Time");

const url = 'https://example.com'; 
console.time("Feature Extraction");
const features = extractFeatures(url);
console.timeEnd("Feature Extraction");

console.time("Logistic Regression Calculation");
const weights = modelData.coef;
const intercept = modelData.intercept;

const dot = features.reduce((sum, f, i) => sum + f * weights[i], 0);
const z = dot + intercept;
const sigmoid = 1 / (1 + Math.exp(-z));

console.timeEnd("Logistic Regression Calculation");

console.log("Is phishing:", sigmoid > 0.5);

console.timeEnd("Total Execution Time");
