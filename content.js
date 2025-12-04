// Content script that runs on every page
(function() {
  const domain = window.location.hostname;
  
  function hideElements() {
    chrome.storage.local.get([domain], (result) => {
      const data = result[domain] || {};
      const hiddenElements = data.hiddenElements || [];
      
      console.log('Hidden elements for', domain, ':', hiddenElements);
      
      hiddenElements.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.style.display !== 'none') {
              el.style.display = 'none';
              console.log('Hidden element:', selector);
            }
          });
        } catch (e) {
          console.error('Error hiding element with selector:', selector, e);
        }
      });
    });
  }
  
  function startObserver() {
    if (!document.body) {
      return;
    }
    
    const observer = new MutationObserver(() => {
      hideElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Hide elements immediately if possible
  if (document.body) {
    hideElements();
    startObserver();
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hideElements();
      startObserver();
    });
  } else {
    // DOM is already ready
    hideElements();
    startObserver();
  }
})();