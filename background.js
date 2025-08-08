// Background script for DS-160 Auto-Filler Extension
// Handles communication between web app and content scripts

// Store DS-160 data received from external web app
let storedDS160Data = null;

// Listen for messages from external web apps (your I-129 filler app)
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log('Received external message:', request);
    
    if (request.action === 'storeDS160Data') {
      // Store the DS-160 data
      storedDS160Data = request.data;
      console.log('DS-160 data stored successfully');
      
      // Also save to chrome.storage for persistence
      chrome.storage.local.set({ 
        ds160Data: storedDS160Data,
        timestamp: new Date().toISOString()
      }, () => {
        sendResponse({ 
          success: true, 
          message: 'Data stored successfully' 
        });
      });
      
      return true; // Will respond asynchronously
    }
    
    if (request.action === 'checkExtension') {
      sendResponse({ 
        installed: true, 
        version: chrome.runtime.getManifest().version 
      });
    }
  }
);

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    console.log('Received internal message:', request);
    
    if (request.action === 'getStoredData') {
      // First try to get from memory
      if (storedDS160Data) {
        sendResponse({ data: storedDS160Data });
      } else {
        // If not in memory, try to get from storage
        chrome.storage.local.get(['ds160Data'], (result) => {
          if (result.ds160Data) {
            storedDS160Data = result.ds160Data;
            sendResponse({ data: storedDS160Data });
          } else {
            sendResponse({ data: null });
          }
        });
        return true; // Will respond asynchronously
      }
    }
    
    if (request.action === 'clearStoredData') {
      storedDS160Data = null;
      chrome.storage.local.remove(['ds160Data'], () => {
        sendResponse({ success: true });
      });
      return true; // Will respond asynchronously
    }
  }
);

// When extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('DS-160 Auto-Filler Extension installed/updated', details);
  
  // Clear any old data on install/update
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.storage.local.clear();
  }
});

// Optional: Clear data after a certain time (e.g., 1 hour)
setInterval(() => {
  chrome.storage.local.get(['timestamp'], (result) => {
    if (result.timestamp) {
      const storedTime = new Date(result.timestamp);
      const now = new Date();
      const hoursDiff = (now - storedTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 1) {
        // Clear data older than 1 hour
        storedDS160Data = null;
        chrome.storage.local.clear();
        console.log('Cleared old DS-160 data');
      }
    }
  });
}, 60000); // Check every minute