export interface DOMFeatures {
    inputs: number;
    forms: number;
    iframes: number;
    scripts: number;
    suspiciousAttrs: number;
}

export function extractDOMFeatures(): DOMFeatures {
    const inputs = document.querySelectorAll('input').length;
    const forms = document.querySelectorAll('form').length;
    const iframes = document.querySelectorAll('iframe').length;
    const scripts = document.querySelectorAll('script[src]').length;
    const suspiciousAttrs = [...document.querySelectorAll('[onmouseover], [onload]')].length;

    return {
        inputs,
        forms,
        iframes,
        scripts,
        suspiciousAttrs,
    };
}
