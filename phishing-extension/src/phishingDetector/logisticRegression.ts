import logregData from '../model/logreg_urls_model.json'

export class LogregClassifier {
    private coefficients: number[];
    private intercept: number;
  
    constructor(coefficients: number[], intercept: number) {
      this.coefficients = coefficients;
      this.intercept = intercept;
    }
  
    private sigmoid(z: number): number {
      return 1 / (1 + Math.exp(-z));
    }
  
    predictProb(features: number[]): number {
      const z = features.reduce(
          (sum, x, i) => sum + x * this.coefficients[i],
          0
      ) + this.intercept;
      return this.sigmoid(z);
    }
  }

  export const logregClassifier = new LogregClassifier(logregData.coefficients, logregData.intercept);