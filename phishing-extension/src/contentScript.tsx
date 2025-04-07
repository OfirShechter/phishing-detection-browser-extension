import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Banner } from './components/Banner';
import { MessageType } from './types/message';

const mountApp = () => {
    const mount = document.createElement('div');
    document.body.prepend(mount);

    const App = () => {
        const [isPhishing, setIsPhishing] = useState<boolean | null>(null);

        useEffect(() => {
            // Send a message to the background script to check if the site is phishing
            chrome.runtime.sendMessage(
                { type: MessageType.CHECK_PHISHING, url: window.location.href },
                (response) => {
                    if (response && typeof response.isPhishing === 'boolean') {
                        setIsPhishing(response.isPhishing);
                    }
                }
            );
            console.log('Is Phishing:', isPhishing);
            // Adjust the body padding to make space for the banner
            document.body.style.paddingTop = '40px';
        }, []);

        return <Banner isPhishing={isPhishing} />;
    };

    ReactDOM.createRoot(mount).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Ensure the DOM is ready before mounting the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
} else {
    mountApp();
}