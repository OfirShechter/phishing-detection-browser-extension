import { decisionTreeUrlClassifier } from "./newClassifier/decisionTree";
import { extractUrlFeatures } from "./newClassifier/features";
console.time("Total Execution Time");

const url = 'http://accountlockseohive.vercel.app/get_help'; 

console.time("Feature Extraction");
const features = extractUrlFeatures(url);
console.timeEnd("Feature Extraction");

console.time("Prediction");
const result = decisionTreeUrlClassifier.predict(features); // Assuming you have a predict method in your classifier
console.timeEnd("Prediction");

console.log(
    "Extracted Features:", features, 
    "Prediction Result:", result
);
console.timeEnd("Total Execution Time");
