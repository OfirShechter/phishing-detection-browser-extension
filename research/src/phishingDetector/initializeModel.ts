import { loadVectorizerData } from "./tfidf";
import { loadModelData } from "./urlTypePredict";

export async function initialize(): Promise<void> {
    // Load both vectorizer and model data at the start
    await Promise.all([loadVectorizerData(), loadModelData()]);
}