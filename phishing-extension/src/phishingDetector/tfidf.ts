import { SparseVector } from "./types.phishingDetector";

type VectorizerData = {
  vocabulary: Record<string, number>;
  idf: number[];
  ngram_range: [number, number];
  analyzer: string;
  lowercase: boolean;
};

let vectorizerData: VectorizerData | null = null;

function l2Normalize(vector: SparseVector): SparseVector {
  // Calculate the L2 norm
  const l2Norm = Math.sqrt(
    Object.values(vector).reduce((sum, value) => sum + value * value, 0)
  );

  // If the norm is 0, return the original vector to avoid division by zero
  if (l2Norm === 0) {
    return vector;
  }

  // Normalize each element in the vector
  const normalizedVector: SparseVector = {};
  for (const key in vector) {
    normalizedVector[key] = vector[key] / l2Norm;
  }

  return normalizedVector;
}

export async function loadVectorizerData(): Promise<void> {
  if (!vectorizerData) {
    const response = await fetch("/model/vectorizer.json");
    vectorizerData = await response.json();
  }
}

export function extractFeatures(url: string): SparseVector {
  if (!vectorizerData) {
    throw new Error(
      "Vectorizer data not loaded. Call loadVectorizerData() first."
    );
  }

  const tf: SparseVector = {};

  const vocab = vectorizerData.vocabulary;
  const idf = vectorizerData.idf;

  const lowered = url.toLowerCase(); // vectorizerData.lowercase == true
  const words = lowered.split(/[^a-z0-9]+/); // vectorizerData.analyzer == "word", Split by non-alphanumeric characters (e.g., "/", "?", "&", "-", "_", etc.)
  const tokensLength = words.length;
  // ngram_range = [1,1] => unigrams, just iterate the words
  words.forEach((word) => {
    const index = vocab[word];
    if (index !== undefined) {
      tf[index] = (tf[index] || 0) + 1;
    }
  });

  const sparseTfidf: SparseVector = {};
  for (const idx in tf) {
    sparseTfidf[idx] = (tf[idx] / tokensLength) * idf[idx];
  }

  return l2Normalize(sparseTfidf);
}
