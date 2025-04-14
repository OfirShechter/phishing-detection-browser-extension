// import { loadVectorizerData } from "./tfidf";
// import { loadModelData } from "./urlTypePredict";

let isModelLoaded = false;

export async function initialize(): Promise<void> {
    // Load both vectorizer and model data at the start
    // await Promise.all([loadVectorizerData(), loadModelData()]);
    isModelLoaded = true;
}

export function isModelReady(): boolean {
  return isModelLoaded; // Expose the flag to check if the model is ready
}