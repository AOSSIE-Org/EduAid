// Create context menus
  chrome.contextMenus.create({
    id: "askExtension",
    title: "Generate Quiz with Selected Text",
    contexts: ["selection"]
  });

  // YouTube-specific quiz generator
  chrome.contextMenus.create({
      id: "generateQuizFromYouTube",
      title: "Generate Quiz from YouTube Video",
      contexts: ["page"],
      documentUrlPatterns: ["*://www.youtube.com/watch?v=*"]
  });

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "askExtension" && info.selectionText) {
      try {
        // Store the selected text first
        await chrome.storage.local.set({ 
          selectedText: info.selectionText 
        });
        
        // Inject content script if needed
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["contentScript.js"]
        });
        
        // Send message to content script
        await chrome.tabs.sendMessage(tab.id, { 
          selectedText: info.selectionText 
        });
  
        // Open the popup
        // Note: Chrome extensions can't programmatically open the popup,
        // but we can show the user where to click
        chrome.action.setPopup({ 
          popup: "src/popup/popup.html"
        });
        
        // Show a badge to indicate text was captured
        chrome.action.setBadgeText({ 
          text: "!"
        });
        chrome.action.setBadgeBackgroundColor({ 
          color: "#FF005C"
        });
  
        // Clear the badge after 2 seconds
        setTimeout(() => {
          chrome.action.setBadgeText({ text: "" });
        }, 2000);
  
      } catch (error) {
        console.error("Error in context menu handler:", error);
      }
    }

    if (info.menuItemId === "generateQuizFromYouTube") {
        try {
            // Check if script has already been injected
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.youtubeScriptLoaded || false
            });
    
            if (!result) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["youtubeContentScript.js"]
                });
            } else {
                console.log("YouTube script already loaded");
            }
            // Add badge notification
            chrome.action.setBadgeText({ 
                text: "!"
            });
            chrome.action.setBadgeBackgroundColor({ 
                color: "#FF005C"
            });

            // Clear the badge after 2 seconds
            setTimeout(() => {
                chrome.action.setBadgeText({ text: "" });
            }, 2000);
        } catch (error) {
            console.error("Error in YouTube quiz generation handler:", error);
        }
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TEXT_SELECTED") {
      chrome.storage.local.set({ 
        selectedText: request.text 
      }, () => {
        console.log("Text saved to storage:", request.text);
        sendResponse({ status: "success" });
      });
      return true; // Required for async sendResponse
    }
  });
  
  //Clear badge when popup is opened
  chrome.action.onClicked.addListener(() => {
    chrome.action.setBadgeText({ text: "" });
  });
  
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
        
        // Store the key-value pair in local storage
        chrome.storage.local.set({ [key]: newValue }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error storing data:", chrome.runtime.lastError);
            } else {
                console.log(`Stored key-value pair: { ${key}: ${newValue} }`);
            }
        });
    }
});

