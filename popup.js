// Simple popup script for DS-160 Auto-Filler

// DOM elements
const dataInput = document.getElementById('dataInput');
const loadBtn = document.getElementById('loadBtn');
const dataSection = document.getElementById('dataSection');
const dataPreview = document.getElementById('dataPreview');
const fillBtn = document.getElementById('fillBtn');
const statusDiv = document.getElementById('status');

let currentData = null;

// Load pasted data
loadBtn.addEventListener('click', () => {
  const pastedData = dataInput.value.trim();
  if (!pastedData) {
    showStatus('Please paste the extracted data from the web app', 'error');
    return;
  }
  
  try {
    // Parse the JSON data
    currentData = JSON.parse(pastedData);
    displayData(currentData);
    showStatus('Data loaded successfully!', 'success');
    
    // Save the data for next time
    chrome.storage.local.set({ lastData: pastedData });
    
  } catch (error) {
    console.error('Error parsing data:', error);
    showStatus('Error: Invalid JSON data. Please copy the complete data from the web app.', 'error');
  }
});

// Display extracted data
function displayData(data) {
  if (!data) return;
  
  const preview = [];
  
  if (data.personal) {
    preview.push('=== PERSONAL ===');
    preview.push(`Name: ${data.personal.givenName} ${data.personal.surname}`);
    preview.push(`DOB: ${data.personal.dateOfBirth}`);
    preview.push(`Passport: ${data.passport?.passportNumber || 'N/A'}`);
  }
  
  if (data.travel) {
    preview.push('\n=== TRAVEL ===');
    preview.push(`Purpose: ${data.travel.purposeOfTrip}`);
  }
  
  dataPreview.textContent = preview.join('\n');
  dataSection.style.display = 'block';
}

// Auto-fill form
fillBtn.addEventListener('click', async () => {
  if (!currentData) {
    showStatus('No data loaded', 'error');
    return;
  }
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('ceac.state.gov')) {
      showStatus('Please navigate to the DS-160 form first', 'error');
      return;
    }
    
    // Store data in chrome storage
    await chrome.storage.local.set({ ds160Data: currentData });
    
    // Check if we can inject scripts into this tab
    if (!tab.id || tab.id < 0) {
      showStatus('Invalid tab. Please open a DS-160 form page.', 'error');
      return;
    }
    
    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.error('Failed to inject content script:', e);
      // Script might already be injected, continue anyway
    }
    
    showStatus('Auto-filling form...', 'info');
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'fillForm', data: currentData }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        showStatus('Error: Could not communicate with the page. Try refreshing.', 'error');
      } else if (response && response.success) {
        showStatus('Form filled successfully!', 'success');
        // Close popup
        setTimeout(() => window.close(), 1000);
      }
    });
    
  } catch (error) {
    console.error('Error filling form:', error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
}

// Load saved data on startup
chrome.storage.local.get('lastData', (result) => {
  if (result.lastData) {
    dataInput.value = result.lastData;
    // Auto-load if data exists
    loadBtn.click();
  }
});