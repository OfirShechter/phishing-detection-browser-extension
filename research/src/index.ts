import { extractFeatures } from "./phishingDetector/tfidf";
import LogisticRegressionModelData from "./model/logistic_regression_model.json";
type LogisticRegressionData = {
    coef: number[];
    intercept: number;
}

let modelData: LogisticRegressionData = LogisticRegressionModelData as LogisticRegressionData; // Initialize with the imported data

    
const url = 'https://example.com'; 
const features = extractFeatures(url);
const weights = modelData.coef;
const intercept = modelData.intercept;

const dot = features.reduce((sum, f, i) => sum + f * weights[i], 0);
const z = dot + intercept;
const sigmoid = 1 / (1 + Math.exp(-z));

console.log(sigmoid > 0.5)

