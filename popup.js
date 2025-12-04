document.getElementById('startHiding').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: enableElementSelection
  });
  
  showStatus('Click on any element to hide it', 'info');
  setTimeout(() => window.close(), 1500);
});

document.getElementById('clearAll').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname;
  
  chrome.storage.local.get([domain], (result) => {
    const data = result[domain] || {};
    delete data.hiddenElements;
    chrome.storage.local.set({ [domain]: data }, () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => location.reload()
      });
      showStatus('All hidden elements cleared!', 'success');
      setTimeout(() => window.close(), 1500);
    });
  });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
}

function enableElementSelection() {
  let overlay = document.createElement('div');
  overlay.id = 'element-hider-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;
  
  let highlightBox = document.createElement('div');
  highlightBox.style.cssText = `
    position: absolute;
    border: 3px solid #ff0000;
    background: rgba(255, 0, 0, 0.1);
    pointer-events: none;
    z-index: 1000000;
    display: none;
  `;
  document.body.appendChild(highlightBox);
  document.body.appendChild(overlay);
  
  function getUniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    
    let path = [];
    while (el.parentElement) {
      let selector = el.tagName.toLowerCase();
      if (el.className) {
        selector += '.' + el.className.trim().replace(/\s+/g, '.');
      }
      
      let sibling = el;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.tagName === el.tagName) nth++;
      }
      if (nth > 1) selector += `:nth-of-type(${nth})`;
      
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }
  

  
  let currentTarget = null;
  
  overlay.addEventListener('mousemove', (e) => {
    overlay.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';
    
    if (target && target !== overlay && target !== highlightBox) {
      currentTarget = target;
      const rect = target.getBoundingClientRect();
      highlightBox.style.left = rect.left + window.scrollX + 'px';
      highlightBox.style.top = rect.top + window.scrollY + 'px';
      highlightBox.style.width = rect.width + 'px';
      highlightBox.style.height = rect.height + 'px';
      highlightBox.style.display = 'block';
    }
  });
  
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentTarget) {
      const selector = getUniqueSelector(currentTarget);
      const domain = window.location.hostname;
      
      chrome.storage.local.get([domain], (result) => {
        const data = result[domain] || {};
        data.hiddenElements = data.hiddenElements || [];
        data.hiddenElements.push(selector);
        
        chrome.storage.local.set({ [domain]: data }, () => {
          currentTarget.style.display = 'none';
          showNotification('Element hidden!');
        });
      });
    }
    
    overlay.remove();
    highlightBox.remove();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      highlightBox.remove();
    }
  });
  
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}