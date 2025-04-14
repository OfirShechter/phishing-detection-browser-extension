import VectorizerDataJson from "../model/vectorizer.json";

type VectorizerData = {
  vocabulary: Record<string, number>;
  idf: number[];
  ngram_range: number[]; // [lower: number, upper: number]
  analyzer: string;
  lowercase: boolean;
};

let vectorizerData: VectorizerData = VectorizerDataJson as VectorizerData; // Initialize with the imported data

export async function loadVectorizerData(): Promise<void> {
  if (!vectorizerData) {
    const response = await fetch("/model/vectorizer.json");
    vectorizerData = await response.json();
  }
}
const vocab = vectorizerData.vocabulary;
// console.log("Vocabulary:", vocab); // Check the vocabulary
// console.log("IDF:", vectorizerData.idf); // Check the IDF values
const idf = vectorizerData.idf;
const vocab_length = Object.keys(vocab).length;
// Generate n-grams
const ngram_range = vectorizerData.ngram_range;
export type SparseVector = Record<number, number>;

export function extractFeatures(url: string): SparseVector {
  const tf: SparseVector = {};

  const lowered = url.toLowerCase(); // vectorizerData.lowercase == true
  const words = lowered.split(/[^a-z0-9]+/); // vectorizerData.analyzer == "word", Split by non-alphanumeric characters (e.g., "/", "?", "&", "-", "_", etc.)
  console.log("words:", words); // Check the split words
  // ngram_range = [1,1] => unigrams, just iterate the words
  words.forEach((word) => {
    const index = vocab[word];
    if (index !== undefined) {
      tf[index] = (tf[index] || 0) + 1;
    }
  });

  const sparseTfidf: SparseVector = {};
  for (const idx in tf) {
    sparseTfidf[+idx] = tf[idx] * idf[+idx];
  }

  return sparseTfidf;
}
