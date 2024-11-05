chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.selectedText) {
      generateQuestions(request.selectedText);
    }
  });
  
  function generateQuestions(text) {
    console.log("Generating questions for:", text);
    chrome.storage.local.set({ "selectedText": text }, () => {
        console.log('Questions stored in local storage:', text);
      });
  }
  