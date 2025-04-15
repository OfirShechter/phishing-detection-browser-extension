import { extractUrlFeatures } from "./newClassifier/features";
console.time("Total Execution Time");

const url = 'http://creditiperhabbogratissicuro100.blogspot.com/2011/02/habbo-crediti-gratis-sicuro-100.html'; 

console.time("Feature Extraction");
const features = extractUrlFeatures(url);
console.timeEnd("Feature Extraction");

console.log("Extracted Features:", features);
console.timeEnd("Total Execution Time");
