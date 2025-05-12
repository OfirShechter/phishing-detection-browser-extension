# Phishing Detection Chrome Extension

A Chrome Extension built with **TypeScript** and **Vite**, designed to help detect phishing websites using AI techniques.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) (install via `npm install -g pnpm`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OfirShechter/phishing-detection-browser-extension.git
   cd phishing-extension
   ```
   
2. Install dependencies:
    ```bash
   pnpm install
   ```

3. Build the extension:

    ```bash
   pnpm build
   ```

4. The built files will be in the dist/ directory.

### Load the Extension in Chrome
1. Open chrome://extensions/ in your Chrome browser.

2. Enable Developer mode (top right toggle).

3. Click Load unpacked and select the dist/ folder.

4. The extension should now be installed and active.

### Test extension
1. pnpm --filter=phishing-extension exec playwright install chromium (once in new env)
2. pnpm --filter=phishing-extension run test:extension
