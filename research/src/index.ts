import { extractUrlFeatures } from "./phishingDetector/features";
console.time("Total Execution Time");

// const url = 'http://creditiperhabbogratissicuro100.blogspot.com/2011/02/habbo-crediti-gratis-sicuro-100.html'; 
const url = ' http://http: //95.211.122.36/update/cache.php';

console.time("Feature Extraction");
const features = extractUrlFeatures(url);
console.timeEnd("Feature Extraction");

console.log("Extracted Features:", features);
console.timeEnd("Total Execution Time");
