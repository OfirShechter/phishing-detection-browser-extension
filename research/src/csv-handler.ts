import fs from 'fs';
import Papa from 'papaparse';

type UrlEntry = {
  url: string;
  label: string; // e.g., "phishing" or "legit"
};

function loadCSV(filePath: string): Promise<UrlEntry[]> {
  return new Promise((resolve, reject) => {
    const csvFile = fs.readFileSync(filePath, 'utf8');
    Papa.parse<UrlEntry>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}
