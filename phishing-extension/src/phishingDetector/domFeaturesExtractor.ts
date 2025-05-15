export interface DOMFeatures {
  forms: number;
  inputs: number;
  iframes: number;
  scripts: number;
  images: number;
  buttons: number;
//   domDepth: number;
//   maxChildren: number;
  titleLength: number;
//   onmouseoverEvents: number;
//   externalResourceRatio: number;
  inlineStyles: number;
  phishingKeywordHits: number;
  hasEval: boolean;
}

// const getExternalResourceRatio = (doc: Document, hostname: string): number => {
//   const resources = Array.from(doc.querySelectorAll("script[src], img[src], link[href]"));
//   const externalCount = resources.filter((res) => {
//     const src = res.getAttribute("src") || res.getAttribute("href");
//     return src && !src.includes(hostname);
//   }).length;
//   return resources.length === 0 ? 0 : externalCount / resources.length;
// };

const getPhishingKeywordsCount = (doc: Document): number => {
  const keywords = ["verify", "account", "login", "password", "secure", "update", "confirm"];
  const bodyText = doc.body?.innerText?.toLowerCase() || "";
  return keywords.reduce((count, word) => count + (bodyText.includes(word) ? 1 : 0), 0);
};

// const getDOMDepth = (node: Node | null, depth = 0, maxDepth = 50): number => {
//   if (!node || !node.hasChildNodes() || depth >= maxDepth) return 1;
//   const childDepths = Array.from(node.childNodes)
//     .filter((child) => child.nodeType === Node.ELEMENT_NODE)
//     .map((child) => getDOMDepth(child, depth + 1, maxDepth));
//   return 1 + (childDepths.length > 0 ? Math.max(...childDepths) : 0);
// };
//
// const getMaxChildrenCount = (root: Element | null): number => {
//   if (!root) return 0;
//   const allElements = root.querySelectorAll("*");
//   let maxChildren = 0;
//   allElements.forEach((el) => {
//     const childCount = el.children.length;
//     if (childCount > maxChildren) maxChildren = childCount;
//   });
//   return maxChildren;
// };

function extractDOMFeaturesObject(html: string, baseHostname: string): DOMFeatures {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  console.log("extract DOM:", baseHostname);

  return {
    forms: doc.querySelectorAll("form").length,
    inputs: doc.querySelectorAll("input").length,
    iframes: doc.querySelectorAll("iframe").length,
    scripts: doc.querySelectorAll("script").length,
    images: doc.querySelectorAll("img").length,
    buttons: doc.querySelectorAll("button").length,
//     domDepth: getDOMDepth(doc.body),
//     maxChildren: getMaxChildrenCount(doc.body),
    titleLength: doc.title?.length || 0,
//     onmouseoverEvents: doc.querySelectorAll("[onmouseover]").length,
//     externalResourceRatio: getExternalResourceRatio(doc, baseHostname),
    inlineStyles: doc.querySelectorAll("[style]").length,
    phishingKeywordHits: getPhishingKeywordsCount(doc),
    hasEval: Array.from(doc.querySelectorAll("script")).some((s) =>
      s.textContent?.includes("eval")
    ),
  };
}

function domFeaturesObjectToArray(features: DOMFeatures): number[] {
  return [
    features.forms,
    features.inputs,
    features.iframes,
    features.scripts,
    features.images,
    features.buttons,
//     features.domDepth,
//     features.maxChildren,
    features.titleLength,
//     features.onmouseoverEvents,
//     features.externalResourceRatio,
    features.inlineStyles,
    features.phishingKeywordHits,
    features.hasEval ? 1 : 0,
  ];
}

export function extractDOMFeatures(html: string, baseHostname: string): number[] {
  const features = extractDOMFeaturesObject(html, baseHostname);
  console.log("got DOM features:", features);
  return domFeaturesObjectToArray(features);
}
