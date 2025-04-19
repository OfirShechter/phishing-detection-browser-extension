import { decisionTreeUrlClassifier } from "./decisionTree";
import { extractUrlFeatures } from "./urlFeaturesExtractor";

export function isPhishingSite(url: string): boolean {
    return urlTypePredict(url);
  }
  
function urlTypePredict(url: string): boolean {
    const urlFeatures = extractUrlFeatures(url);
    return decisionTreeUrlClassifier.predict(urlFeatures) === 1; // 1 indicates phishing
}