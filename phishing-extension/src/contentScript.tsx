import React from 'react';
import ReactDOM from 'react-dom/client';
// // import { Banner } from './components/Banner';

const mount = document.createElement('div');
document.body.prepend(mount);

// const App = () => {
//     const [isPhishing, setIsPhishing] = useState<boolean | null>(null);

//     useEffect(() => {
//         // Send a message to the background script to check if the site is phishing
//         chrome.runtime.sendMessage(
//             { type: MessageType.CHECK_PHISHING, url: window.location.href },
//             (response) => {
//                 if (response && typeof response.isPhishing === 'boolean') {
//                     setIsPhishing(response.isPhishing);
//                 }
//             }
//         );
//     }, []);

//     // Show a loading state until the phishing status is determined
//     if (isPhishing === null) {
//         return <div>Loading...</div>;
//     }
//     return <></>
//     // return <Banner isPhishing={isPhishing} />;
// };

ReactDOM.createRoot(mount).render(
    <React.StrictMode>
        {/* <App /> */}
    </React.StrictMode>
);
