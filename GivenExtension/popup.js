async function getCurrentTabId(){
  return await chrome.tabs.query({active:true, currentWindow: true}, (tabs) =>{
    if (tabs.length > 0){
      return tabs[0].id;
    }
    return undefined;
  });
}
document.addEventListener('DOMContentLoaded', ()=> {
  chrome.tabs.query({active:true, currentWindow: true}, (tabs) =>{
    if (tabs.length === 0){
      return;
    }
    currentTabId = tabs[0].id;
    console.log(currentTabId)
    chrome.tabs.sendMessage(currentTabId, {action : 'GetPrediction'}, (response) => {
      
      if (chrome.runtime.lastError) {
        document.getElementById('result').textContent = "Error retrieving classification";
        return;
      }

      const { isURL, isContent, details } = response.result;
      const isPhishing = isURL || isContent;
      const resultEl = document.getElementById('result');
      resultEl.innerHTML = `
      <ul>
        <li class="${isURL ? 'phishing' : 'safe'}">URL Detector</li>
        <li class="${isContent ? 'phishing' : 'safe'}">Content Detector</li>
      </ul>
      <p/>
        <div class="${isPhishing ? 'phishing' : 'safe'}">${details}</div>
      `;
    });
  });

});


