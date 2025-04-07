import { useState } from 'react';

const Popup = () => {
    const [isPhishing, setIsPhishing] = useState<boolean | null>(null);

    if (isPhishing === null) {
        // Retrieve the phishing status from chrome.storage
        chrome.storage.local.get('phishingStatus', (result) => {
            if (result.phishingStatus) {
                setIsPhishing(result.phishingStatus.isPhishing);
            }
        });
    };

    return (
        <div style={{ width: 300, padding: 20 }}>
            <h2>🔍 Phishing Status</h2>
            {isPhishing === null ? (
                <p>Loading...</p>
            ) : isPhishing ? (
                <p style={{ color: 'red' }}>⚠️ This site may be a phishing attempt!</p>
            ) : (
                <p style={{ color: 'green' }}>✅ This site looks safe.</p>
            )}
        </div>
    );
};

export default Popup;