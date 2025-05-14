import fullTree from '../model/full_decision_tree_model.json';
import htmlTree from '../model/html_decision_tree_model.json';
import logregData from '../model/logreg_urls_model.json'

type TreeNode = {
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number; // for leaf nodes
};

export class DecisionTreeClassifier {
  private tree: TreeNode;

  constructor(tree: TreeNode) {
    this.tree = tree;
  }

  predict(input: number[]): number {
    let node: TreeNode = this.tree;

    while (node.value === undefined) {
      const featureValue = input[node.feature!];
      if (featureValue <= node.threshold!) {
        node = node.left!;
      } else {
        node = node.right!;
      }
    }

    return node.value;
  }
}

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

  predict(features: number[]): number {
    return this.predictProb(features) > 0.5 ? 1 : 0;
  }
}

export const fullDecisionTreeClassifier = new DecisionTreeClassifier(fullTree);
export const htmlDecisionTreeClassifier = new DecisionTreeClassifier(htmlTree);
export const logregClassifier = new LogregClassifier(logregData.coefficients, logregData.intercept);