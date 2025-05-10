import logReg from '../model/logreg_urls_model.json';

const legitimateThreshold = 0.91

export class LogisticRegressionClassifier {
  private coefficients: number[];
  private intercept: number;
  private phishingThreshold: number = 0.5; // Default threshold for phishing detection

  constructor(logRegModel: { coefficients: number[]; intercept: number }, legitimateThreshold: number) {
    this.coefficients = logRegModel.coefficients;
    this.intercept = logRegModel.intercept;
    this.phishingThreshold = 1 - legitimateThreshold;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  predict(features: number[]): boolean {
    const dot = features.reduce((sum, x_i, i) => sum + x_i * this.coefficients[i], 0);
    const z = dot + this.intercept;
    const proba = this.sigmoid(z);

    return proba >= this.phishingThreshold; // Return true if phishing, false otherwise
  }
}

export const logRegUrlClassifier = new LogisticRegressionClassifier(logReg, legitimateThreshold);