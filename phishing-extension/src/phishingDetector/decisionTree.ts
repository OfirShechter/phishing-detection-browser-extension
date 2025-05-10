import htmlTree from '../model/html_decision_tree_model.json';
import fullTree from '../model/full_decision_tree_model.json';

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

export const htmlDecisionTreeClassifier = new DecisionTreeClassifier(htmlTree);

export const fullDecisionTreeClassifier = new DecisionTreeClassifier(fullTree);