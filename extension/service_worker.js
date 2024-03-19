function setupContextMenu() {
    chrome.contextMenus.create({
      id: 'quiz',
      title: 'Generate the Quiz',
      contexts: ['selection']
    });
  }
  chrome.runtime.onInstalled.addListener(() => {
    setupContextMenu();
  });
  
  chrome.contextMenus.onClicked.addListener((data) => {
    chrome.storage.local.set({ key: data.selectionText }).then(() => { console.log("Value is set"); });
  });

