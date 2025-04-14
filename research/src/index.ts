import { extractFeatures, SparseVector } from "./phishingDetector/tfidf";
import LogisticRegressionModelData from "./model/logistic_regression_model.json";
type LogisticRegressionData = {
    coef: number[];
    intercept: number;
}

let modelData: LogisticRegressionData = LogisticRegressionModelData as LogisticRegressionData; // Initialize with the imported data

function sparseDotProduct(sparseVec: SparseVector, weights: number[]): number {
    let dot = 0;
    for (const i in sparseVec) {
      dot += sparseVec[i] * weights[+i];
    }
    return dot;
  }
  
console.time("Total Execution Time");

// const url = 'http://creditiperhabbogratissicuro100.blogspot.com/2011/02/habbo-crediti-gratis-sicuro-100.html'; 
const url = 'http://djchusmusic.com'
console.time("Feature Extraction");
const features = extractFeatures(url);
console.timeEnd("Feature Extraction");

console.time("Logistic Regression Calculation");
// const weights = modelData.coef;
// const intercept = modelData.intercept;

const dot = sparseDotProduct(features, modelData.coef);
const z = dot + modelData.intercept;
const sigmoid = 1 / (1 + Math.exp(-z));

console.timeEnd("Logistic Regression Calculation");


console.timeEnd("Total Execution Time");

console.log("Is phishing:", sigmoid > 0.5);
console.log("Prediction probability:", sigmoid); // Check the prediction probability
console.log("Features:", features); // Check the extracted features
console.log("Dot Product:", dot); // Check the dot product
console.log("z value:", z); // Check the z value
