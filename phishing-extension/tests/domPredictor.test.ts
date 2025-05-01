
// Optional: load and inspect the real model

import {DOMFeatures} from "../src/phishingDetector/domFeaturesExtractor";
import {predictDOMPhishing} from "../src/phishingDetector/domPredictor";

describe('predictDOMPhishing - real model', () => {
    it('should classify an obvious phishing DOM as phishing', () => {
        const features: DOMFeatures = {
            forms: 5,
            inputs: 10,
            iframes: 3,
            scripts: 15,
            images: 2,
            buttons: 0,
            domDepth: 25,
            maxChildren: 30,
            titleLength: 5,
            onmouseoverEvents: 4,
            externalResourceRatio: 0.9,
            inlineStyles: 12,
            phishingKeywordHits: 6,
            usesHTTPS: false,
            hasEval: true,
        };

        const result = predictDOMPhishing(features);
        expect(result).toBe(true);
    });

    it('should classify a typical safe news site as not phishing', () => {
        const features: DOMFeatures = {
            forms: 1,
            inputs: 2,
            iframes: 0,
            scripts: 3,
            images: 12,
            buttons: 4,
            domDepth: 18,
            maxChildren: 10,
            titleLength: 35,
            onmouseoverEvents: 0,
            externalResourceRatio: 0.3,
            inlineStyles: 2,
            phishingKeywordHits: 0,
            usesHTTPS: true,
            hasEval: false,
        };

        const result = predictDOMPhishing(features);
        expect(result).toBe(false);
    });

    it('should return a boolean', () => {
        const dummyFeatures: DOMFeatures = {
            forms: 0,
            inputs: 0,
            iframes: 0,
            scripts: 0,
            images: 0,
            buttons: 0,
            domDepth: 0,
            maxChildren: 0,
            titleLength: 0,
            onmouseoverEvents: 0,
            externalResourceRatio: 0,
            inlineStyles: 0,
            phishingKeywordHits: 0,
            usesHTTPS: true,
            hasEval: false,
        };

        const result = predictDOMPhishing(dummyFeatures);
        expect(typeof result).toBe("boolean");
    });
});
