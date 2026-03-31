function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "askExtension",
      title: "Generate Quiz with Selected Text",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "generateQuizFromYouTube",
      title: "Generate Quiz from YouTube Video",
      contexts: ["page"],
      documentUrlPatterns: ["*://www.youtube.com/watch?v=*"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    return;
  }

  if (info.menuItemId === "askExtension" && info.selectionText) {
    try {
      await chrome.storage.local.set({ selectedText: info.selectionText });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["contentScript.js"],
      });

      await chrome.tabs.sendMessage(tab.id, { selectedText: info.selectionText });

      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF005C" });
      setTimeout(clearBadge, 2000);
    } catch (error) {
      console.error("Error in context menu handler:", error);
    }
  }

  if (info.menuItemId === "generateQuizFromYouTube") {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.youtubeScriptLoaded || false,
      });

      if (!result) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["youtubeContentScript.js"],
        });
      }

      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF005C" });
      setTimeout(clearBadge, 2000);
    } catch (error) {
      console.error("Error in YouTube quiz generation handler:", error);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "TEXT_SELECTED") {
    chrome.storage.local.set({ selectedText: request.text }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error storing selected text:", chrome.runtime.lastError);
        sendResponse({ status: "error" });
        return;
      }

      sendResponse({ status: "success" });
    });

    return true;
  }

  return false;
});

chrome.action.onClicked.addListener(clearBadge);

chrome.storage.onChanged.addListener((changes, namespace) => {
  Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  });
});
