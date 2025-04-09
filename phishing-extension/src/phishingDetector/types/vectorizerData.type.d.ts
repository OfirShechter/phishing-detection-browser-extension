type VectorizerData = {
    vocabulary: Record<string, number>;
    idf: number[];
    ngram_range: [number, number]
    analyzer: string;
    lowercase: boolean;
}