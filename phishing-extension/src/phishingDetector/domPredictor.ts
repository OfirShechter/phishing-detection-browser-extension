import model from "../model/dom_model.json";
import {DOMFeatures} from "./domFeaturesExtractor";

type TreeNode =
    | {
    feature: string;
    threshold: number;
    left: TreeNode;
    right: TreeNode;
}
    | {
    value: number[][];
};

function evaluateTree(tree: TreeNode, features: Record<string, number>): number {
    if ("value" in tree) {
        const [counts] = tree.value;
        return counts[1] > counts[0] ? 1 : 0;
    }

    const featureValue = features[tree.feature];
    if (featureValue <= tree.threshold) {
        return evaluateTree(tree.left, features);
    } else {
        return evaluateTree(tree.right, features);
    }
}

export function predictDOMPhishing(features: DOMFeatures): boolean {
    // Convert boolean to numeric
    const flatFeatures: Record<string, number> = {
        forms: features.forms,
        inputs: features.inputs,
        iframes: features.iframes,
        scripts: features.scripts,
        images: features.images,
        buttons: features.buttons,
        domDepth: features.domDepth,
        maxChildren: features.maxChildren,
        titleLength: features.titleLength,
        onmouseoverEvents: features.onmouseoverEvents,
        externalResourceRatio: features.externalResourceRatio,
        inlineStyles: features.inlineStyles,
        phishingKeywordHits: features.phishingKeywordHits,
        usesHTTPS: features.usesHTTPS ? 1 : 0,
        hasEval: features.hasEval ? 1 : 0,
    };
    flatFeatures.usesHTTPS = features.usesHTTPS ? 1 : 0;
    flatFeatures.hasEval = features.hasEval ? 1 : 0;

    const predictions = (model as TreeNode[]).map((tree) =>
        evaluateTree(tree, flatFeatures)
    );

    const voteSum = predictions.reduce((sum, p) => sum + p, 0);
    return voteSum > predictions.length / 2;
}
