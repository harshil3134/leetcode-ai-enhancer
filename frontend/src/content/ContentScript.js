import { ProblemDetector } from "../utils/problemDetector";

console.log('🧠 Content script loaded!')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function initializeDetector() {
  try {
    // Check if we're on a problem page
    if (!window.location.pathname.includes('/problems/')) {
      console.log('🚫 Not on a problem page');
      return null;
    }

    console.log('🔍 Starting problem detection...');
    const detector = new ProblemDetector();
    
    // Use waitForProblemLoad with proper retry logic
    const data = await detector.waitForProblemLoad(15, 1000);
    
    if (data) {
      console.log("✅ Successfully detected problem:", data);
    } else {
      console.log("❌ Failed to detect problem - trying manual extraction...");
      
      // Fallback: try manual extraction after waiting a bit more
      await sleep(2000);
      const fallbackData = await detector.extractProblem();
      console.log("🔄 Fallback result:", fallbackData);
      return fallbackData;
    }
    
    return data;
  } catch (err) {
    console.error('❌ Error detecting problem:', err);
    return null;
  }
}

async function initializeCodeFetcher() {
  try {
    // Check if we're on a problem page
    if (!window.location.pathname.includes('/problems/')) {
      console.log(' Not on a problem page');
      return null;
    }

    console.log('🔍 Starting problem detection...');
    const detector = new ProblemDetector();
    
      const data = detector.fetchCode();
      console.log("🔄 fetching code:", data);
      return data;
    }
     catch (err) {
    console.error('❌ Error detecting problem:', err);
    return null;
  }
}

// Single initialization point
let isInitialized = false;

async function initialize() {
  if (isInitialized) {
    console.log('🔄 Already initialized, skipping...');
    return;
  }
  
  isInitialized = true;
  console.log('🚀 Initializing detector...');
  
  // Wait a bit for page to settle
  await sleep(1000);
  
  const result = await initializeDetector();
  console.log('🎯 Final result:', result);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for URL changes (for LeetCode SPA navigation)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('🔄 URL changed to:', currentUrl);
    
    if (window.location.pathname.includes('/problems/')) {
      isInitialized = false; // Reset for new problem
      setTimeout(initialize, 1500); // Wait for page to load
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
console.log("📨 Message received in content script:", request);
  // Wait a bit for page to settle
  if(request.type=="GETDATA")
  {
 initializeDetector().then(result => {
    console.log("GETDATA Final result:", result);
    sendResponse({ success: true, data: { result} });
  }); 
  return true; // Keep channel open
  }
  // await sleep(1000);
})

// Enhanced message listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 Received message:', msg);
  
  if (msg.action === 'showHint') {
    const hint = document.createElement('div');
    hint.innerText = '💡 Hint: Try sliding window!';
    hint.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 12px 16px;
      background: #fff;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
    `;
    document.body.appendChild(hint);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (hint.parentNode) {
        hint.parentNode.removeChild(hint);
      }
    }, 5000);
    
    sendResponse({ success: true });
  }
  
  if (msg.action === 'getCurrentProblem') {
    initializeDetector().then(data => {
      sendResponse({ success: true, data });
    });
    return true; // Keep message channel open
  }
});

// Debug: Log current page info
console.log('📍 Current URL:', window.location.href);
console.log('📍 Pathname:', window.location.pathname);
console.log('📍 Is problem page:', window.location.pathname.includes('/problems/'));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LEETCODE_DATA") {
    initializeDetector().then((result) => {
      console.log("📤 Sending problem data back:", result);
      sendResponse({
        success: true,
        data: result   
      });
    }).catch(err => {
      console.error(" Error in detector:", err);
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
console.log("📨 Message received in content script:", request);
  // Wait a bit for page to settle
  if(request.type=="GETUSERCODE")
  {
initializeCodeFetcher().then(result => {
    console.log("GETUSERCODE Final result:", result);
    sendResponse({ success: true, data: { result} });
  }); 

  return true; // Keep channel open

  }
  // await sleep(1000);
})


