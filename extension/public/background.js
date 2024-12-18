// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "askExtension",
      title: "Generate Quiz with Selected Text",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "get_mcq",
      title: "Generate MCQ questions",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "get_boolq",
      title: "Generate true/ false type questions",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "get_shortq",
      title: "Generate Short questions",
      contexts: ["selection"]
    });
});

async function openExtensionWithUrl(url, tab) {
  try {
    // Set popup
    chrome.action.setPopup({ 
      popup: url
    });

    // Open popup
    chrome.action.openPopup();

    // This exists to ensure user is notified of change in case the popup did not open
    // Show a badge to indicate text was captured
    chrome.action.setBadgeText({ 
      text: "!"
    });
    chrome.action.setBadgeBackgroundColor({ 
      color: "#FF005C"
    });

    // Clear the badge after 2 seconds and reset popup view
    setTimeout(async () => {
      chrome.action.setBadgeText({ text: "" });
      
      await chrome.action.setPopup({ 
        popup: 'src/pages/home/home.html'
      });
    }, 2000);

  } catch (error) {
    throw error;
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    // Store the selected text locally
    await chrome.storage.local.set({ selectedText: info.selectionText });

    if (info.menuItemId === "askExtension" && info.selectionText) {
      // Option page to select question type and difficulty
      await openExtensionWithUrl("src/pages/home/home.html", tab);
    } else if (
      info.menuItemId === "get_mcq" ||
      info.menuItemId === "get_shortq" ||
      info.menuItemId === "get_boolq"
    ) {
        
      // Construct the URL with the question type
      const baseUrl = "src/pages/text_input/text_input.html";
      const encodedUrl = `${baseUrl}?questionType=${encodeURIComponent(info.menuItemId)}`;

      // Open the extension with the constructed URL
      await openExtensionWithUrl(encodedUrl, tab);
    }
  } catch (error) {
    console.error("Error in handling context menu:", error);
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

  
// Optional: Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Extension installed");
  } else if (details.reason === "update") {
    console.log("Extension updated");
  }
});
