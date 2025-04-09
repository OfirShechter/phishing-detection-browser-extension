
let vectorizerData: VectorizerData | null = null;

export async function loadVectorizerData(): Promise<void> {
  if (!vectorizerData) {
      const response = await fetch('/model/vectorizer.json');
      vectorizerData = await response.json();
  }
}

export function extractFeatures(url: string): number[] {
  if (!vectorizerData) {
      throw new Error("Vectorizer data not loaded. Call loadVectorizerData() first.");
  }

  const vocab = vectorizerData.vocabulary;
  const idf = vectorizerData.idf;

  // Generate n-grams
  const ngram_range = vectorizerData.ngram_range;
  const tokens: string[] = [];

  const lowered = vectorizerData.lowercase ? url.toLowerCase() : url;
  for (let n = ngram_range[0]; n <= ngram_range[1]; n++) {
      for (let i = 0; i <= lowered.length - n; i++) {
          tokens.push(lowered.substring(i, i + n));
      }
  }

  const tf = new Array(Object.keys(vocab).length).fill(0);
  tokens.forEach((token) => {
      if (token in vocab) tf[vocab[token]] += 1;
  });

  // Apply TF-IDF
  return tf.map((freq, idx) => freq * idf[idx]);
}