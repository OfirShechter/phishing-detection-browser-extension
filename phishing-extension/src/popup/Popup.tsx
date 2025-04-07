import { useState } from 'react';
import { MessageType } from '../types/message';

const Popup = () => {
    const [isPhishing, setIsPhishing] = useState<boolean | null>(null);

    if (isPhishing === null) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { type: MessageType.GET_PHISHING_STATUS },
                    (response) => {
                        if (response && typeof response.isPhishing === 'boolean') {
                            setIsPhishing(response.isPhishing);
                        }
                    }
                );
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