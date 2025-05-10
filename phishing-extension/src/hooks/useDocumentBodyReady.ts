import { useEffect, useState } from 'react';

/**
 * Hook that triggers when document.body becomes available.
 * Returns true if document.body is ready.
 */
export function useDocumentBodyReady(): boolean {
    const [isReady, setIsReady] = useState(!!document.body);

    useEffect(() => {
        if (document.body) {
            setIsReady(true);
            return;
        }

        const observer = new MutationObserver(() => {
            if (document.body) {
                setIsReady(true);
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, { childList: true });

        return () => observer.disconnect();
    }, []);

    return isReady;
}
