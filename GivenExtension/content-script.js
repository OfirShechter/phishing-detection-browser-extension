
function getPhishingPrediction(){
  const isURL = isDetectedByURL() == 1;
  const isContent = isDetectedByContent() == 1;
  const isPhishing = isURL || isContent;
  return {
    isURL,
    isContent,
    details: isPhishing ? "This page may be a phishing attempt." : "This page seems safe."
  };
}



chrome.runtime.onMessage.addListener((request,sender, sendResponese) => {
  if (request.action ==='GetPrediction'){
    sendResponese({result : getPhishingPrediction()});
  }
});

function isDetectedByURL(){
  const parsedUrl = new URL(window.location.href);
  const hostname = parsedUrl.hostname; // e.g., sub.example.com
    
    // Split the hostname into parts (e.g., ['sub', 'example', 'com'])
    const parts = hostname.split('.');
    
    let score =0;
    // Ensure we have at least one subdomain (minimum 3 parts: subdomain, domain, TLD)
    if (parts.length < 3) {
      return score;
    }
    
    // Extract the subdomain portion (all parts except the last two)
    const subdomainParts = parts.slice(0, parts.length - 2);
    const subdomain = subdomainParts.join('.');
    
    // Check the first condition: subdomain length must be greater than 5
    if (subdomain.length > 5) {
      score += 0.5;
    }
    
    // Extract the main domain (assuming the second-to-last part)
    const domain = parts[parts.length - 2].toLowerCase();
    
    // List of known free hosting providers (adjust as needed)
    const freeHostingProviders = [
      "000webhost",
      "freehostia",
      "neocities",
      "wordpress",
      "blogspot",
      "netlify",
      "weebly",
      "github",
      "weeblysite"
    ];
    const isFreeHosting = freeHostingProviders.includes(domain);
    
    // Check if the URL has multiple segments divided by hyphen.
    // Splitting by '-' yields an array; if there is at least one hyphen,
    // then there are multiple segments.
    const hasHyphenSegments = window.location.href.split('-').length > 1;
    
    // Apply the heuristic:
    // IF (subdomain length > 5) AND ((is free hosting) OR (has hyphen segments))
    if (isFreeHosting || hasHyphenSegments) {
      score += 0.5;
    }
    
    return score;
}

function isDetectedByContent(){
  let score = 0;
  const htmlLength = document.documentElement.outerHTML.length;
  const isHtmlShort = htmlLength < 7500;
  if (isHtmlShort){
    score += 0.35;
  }
  // Condition 2: Check form actions
  const forms = document.querySelectorAll("form");
  let insecureForms = 0;
  forms.forEach(form => {
    const action = form.getAttribute("action");
    if (!action || action.startsWith("http://")) {
      insecureForms++;
    }
  });
  const hasInsecureForm = insecureForms > 0;
  if (hasInsecureForm){
    score += 0.35;
  }
  // Condition 3: Check external images
  const images = document.querySelectorAll("img");
  let externalImages = 0;
  const currentDomain = window.location.hostname;
  images.forEach(img => {
    const src = img.getAttribute("src");
    if (src && src.startsWith("http") && !src.includes(currentDomain)) {
      externalImages++;
    }
  });
  const isFewExternalImages = externalImages <= 5;
  if (isFewExternalImages){
    score += 0.35;
  }

  return Math.min(score,1);
      
}