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
    usesHTTPS: boolean;
    hasEval: boolean;
}

export function safeExtractDOMFeatures(): DOMFeatures | null {
    try {
        var dom = extractDOMFeatures();
        console.log("DOM features extracted:", dom);
        return dom;
    } catch (err) {
        console.error("DOM feature extraction failed", err);
        return null;
    }
}


export function extractDOMFeatures(): DOMFeatures {
    const getExternalResourceRatio = () => {
      const originHost = window.location.hostname;
      const resources = Array.from(document.querySelectorAll('script[src], img[src], link[href]'));
      const externalCount = resources.filter(res => {
        const src = res.getAttribute('src') || res.getAttribute('href');
        if (!src) return false;
        try {
          const host = new URL(src, window.location.href).hostname;
          return host !== originHost;
        } catch { return false; }
      }).length;
      return resources.length === 0 ? 0 : externalCount / resources.length;
    };

    const getPhishingKeywordsCount = () => {
      const keywords = ['verify', 'account', 'login', 'password', 'secure', 'update', 'confirm'];
      const bodyText = document.body?.innerText?.toLowerCase() || '';
      return keywords.reduce((count, word) => {
        const matches = bodyText.match(new RegExp(word, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
    };

    const getDOMDepth = (node: Node = document.body, depth = 0, maxDepth = 50): number => {
        if (!node) {
            return depth;
        }
        if (!node.hasChildNodes() || depth >= maxDepth) return 1;
        const childDepths = Array.from(node.childNodes)
            .filter(child => child.nodeType === Node.ELEMENT_NODE)
            .map(child => getDOMDepth(child, depth + 1, maxDepth));
        return 1 + (childDepths.length > 0 ? Math.max(...childDepths) : 0);
    };

    const getMaxChildrenCount = (root: Element = document.body): number => {
        if (!root) {
            return 0;
        }
        const allElements = root.querySelectorAll("*");
        if (allElements.length === 0) return 0;

        let maxChildren = 0;
        allElements.forEach(el => {
            const childCount = el.children.length;
            if (childCount > maxChildren) maxChildren = childCount;
        });

        return maxChildren;
    };

    const hasEval = Array.from(document.querySelectorAll('script')).some(script => {
        const code = script.textContent || '';
        return code.includes('eval');
    });

    return {
        forms: document.querySelectorAll('form').length,
        inputs: document.querySelectorAll('input').length,
        iframes: document.querySelectorAll('iframe').length,
        scripts: document.querySelectorAll('script').length,
        images: document.querySelectorAll('img').length,
        buttons: document.querySelectorAll('button').length,
        domDepth: getDOMDepth(),
        maxChildren: getMaxChildrenCount(),
        titleLength: document.title.length,
        onmouseoverEvents: document.querySelectorAll('[onmouseover]').length,
        externalResourceRatio: getExternalResourceRatio(),
        inlineStyles: document.querySelectorAll('[style]').length,
        phishingKeywordHits: getPhishingKeywordsCount(),
        usesHTTPS: window.location.protocol === 'https:',
        hasEval: hasEval,
    };
}
