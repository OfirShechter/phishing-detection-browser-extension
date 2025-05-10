export interface DOMFeatures {
  forms: number;
  inputs: number;
  iframes: number;
  scripts: number;
  images: number;
  buttons: number;
  domDepth: number;
  maxChildren: number;
  titleLength: number;
  onmouseoverEvents: number;
  externalResourceRatio: number;
  inlineStyles: number;
  phishingKeywordHits: number;
  hasEval: boolean;
}

export function safeExtractDOMFeatures(): number[] | null {
  try {
    return extractDOMFeatures();
  } catch (err) {
    console.error("DOM feature extraction failed", err);
    return null;
  }
}

const getExternalResourceRatio = () => {
  const resources = Array.from(
    document.querySelectorAll("script[src], img[src], link[href]")
  );
  const externalCount = resources.filter((res) => {
    const src = res.getAttribute("src") || res.getAttribute("href");
    if (!src) return false;
    return !src.includes(window.location.hostname);
  }).length;
  return resources.length === 0 ? 0 : externalCount / resources.length;
};

const getPhishingKeywordsCount = () => {
  const keywords = [
    "verify",
    "account",
    "login",
    "password",
    "secure",
    "update",
    "confirm",
  ];
  const bodyText = document.body?.innerText?.toLowerCase() || "";
  return keywords.reduce(
    (count, word) => count + (bodyText.includes(word) ? 1 : 0),
    0
  );
};

const getDOMDepth = (
  node: Node = document.body,
  depth = 0,
  maxDepth = 50
): number => {
  if (!node) {
    return depth;
  }
  if (!node.hasChildNodes() || depth >= maxDepth) return 1;
  const childDepths = Array.from(node.childNodes)
    .filter((child) => child.nodeType === Node.ELEMENT_NODE)
    .map((child) => getDOMDepth(child, depth + 1, maxDepth));
  return 1 + (childDepths.length > 0 ? Math.max(...childDepths) : 0);
};

const getMaxChildrenCount = (root: Element = document.body): number => {
  if (!root) {
    return 0;
  }
  const allElements = root.querySelectorAll("*");
  if (allElements.length === 0) return 0;

  let maxChildren = 0;
  allElements.forEach((el) => {
    const childCount = el.children.length;
    if (childCount > maxChildren) maxChildren = childCount;
  });

  return maxChildren;
};

function extractDOMFeaturesObject(): DOMFeatures {
    return {
      forms: document.querySelectorAll("form").length,
      inputs: document.querySelectorAll("input").length,
      iframes: document.querySelectorAll("iframe").length,
      scripts: document.querySelectorAll("script").length,
      images: document.querySelectorAll("img").length,
      buttons: document.querySelectorAll("button").length,
      domDepth: getDOMDepth(),
      maxChildren: getMaxChildrenCount(),
      titleLength: document.title.length,
      onmouseoverEvents: document.querySelectorAll("[onmouseover]").length,
      externalResourceRatio: getExternalResourceRatio(),
      inlineStyles: document.querySelectorAll("[style]").length,
      phishingKeywordHits: getPhishingKeywordsCount(),
      hasEval: Array.from(document.querySelectorAll("script")).some((s) =>
        s.innerText.includes("eval")
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
        features.domDepth,
        features.maxChildren,
        features.titleLength,
        features.onmouseoverEvents,
        features.externalResourceRatio,
        features.inlineStyles,
        features.phishingKeywordHits,
        features.hasEval ? 1 : 0,
    ]
  }

  
export function extractDOMFeatures(): number[] {
  const features = extractDOMFeaturesObject();
  console.log("got DOM features:", features)
  return domFeaturesObjectToArray(features);
}
