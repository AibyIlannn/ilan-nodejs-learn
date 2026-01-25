// ILAN LEARNING PLATFORM - PRODUCTION-GRADE CLIENT SCRIPT
// Enhanced Performance, Error Handling, and User Experience

console.log("✅ Client script initialized");


const DOM = {
  chatBox: document.getElementById("chatBox"),
  chatInput: document.getElementById("chatInput"),
  mobileAside: document.getElementById("mobileAside"),
  overlay: document.getElementById("overlay"),
  displayUserId: document.getElementById("displayUserId")
};

let userId = localStorage.getItem("user_id");

if (!userId) {
  // Generate secure random user ID
  userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem("user_id", userId);
  console.log("🆔 New user ID generated:", userId);
} else {
  console.log("🆔 Existing user ID loaded:", userId);
}

// Display user ID in UI if element exists
if (DOM.displayUserId) {
  DOM.displayUserId.textContent = userId;
}

function openMenu() {
  DOM.mobileAside.classList.add("active");
  DOM.overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  console.log("📱 Mobile menu opened");
}

function closeMenu() {
  DOM.mobileAside.classList.remove("active");
  DOM.overlay.classList.remove("active");
  document.body.style.overflow = "auto";
  console.log("📱 Mobile menu closed");
}

// Close menu when clicking overlay
if (DOM.overlay) {
  DOM.overlay.addEventListener("click", closeMenu);
}

// Close menu with ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && DOM.mobileAside.classList.contains("active")) {
    closeMenu();
  }
});

/**
 * Format timestamp to readable time
 * @param {string|Date} time - Timestamp to format
 * @returns {string} Formatted time (HH:MM)
 */
function formatTime(time) {
  const date = new Date(time);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Scroll chat to bottom smoothly
 */
function scrollToBottom() {
  if (DOM.chatBox) {
    DOM.chatBox.scrollTo({
      top: DOM.chatBox.scrollHeight,
      behavior: "smooth"
    });
  }
}

/**
 * Debounce function to limit rapid calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Render chat message in the chat box
 * @param {string} message - Message content
 * @param {string|Date} time - Message timestamp
 * @param {boolean} isUser - Whether message is from current user
 * @param {string} chatUserId - User ID of message sender
 */
function renderChat(message, time, isUser, chatUserId) {
  if (!DOM.chatBox) return;

  const div = document.createElement("div");
  div.className = `chat ${isUser ? "user" : "other"}`;
  
  // Sanitize message to prevent XSS
  const safeMessage = sanitizeHTML(message);
  
  div.innerHTML = `
    <div>${safeMessage}</div>
    <div class="chat-meta">
      <div class="chat-time">
        <i class="fas fa-clock"></i> ${formatTime(time)}
      </div>
      <div class="chat-id">
        <i class="fas fa-fingerprint"></i> ${chatUserId || 'system'}
      </div>
    </div>
  `;

  DOM.chatBox.appendChild(div);
  
  // Smooth scroll to bottom with slight delay for animation
  setTimeout(scrollToBottom, 100);
}

/**
 * Show error notification with auto-dismiss
 * @param {string} message - Error message to display
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showErrorNotification(message, duration = 5000) {
  const notification = document.createElement("div");
  notification.className = "error-notification";
  notification.setAttribute("role", "alert");
  notification.setAttribute("aria-live", "assertive");
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <i class="fas fa-exclamation-circle" style="font-size: 24px;"></i>
      <div>
        <div style="font-weight: 700; margin-bottom: 4px;">Pesan Ditolak</div>
        <div style="font-size: 14px; opacity: 0.95;">${sanitizeHTML(message)}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0; margin-left: auto;"
              aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(notification);
  console.warn("⚠️ Error notification:", message);

  // Auto-dismiss after duration
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

/**
 * Show success notification
 * @param {string} message - Success message to display
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showSuccessNotification(message, duration = 3000) {
  const notification = document.createElement("div");
  notification.className = "success-notification";
  notification.setAttribute("role", "status");
  notification.setAttribute("aria-live", "polite");
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(39, 174, 96, 0.3);
    z-index: 10000;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <i class="fas fa-check-circle" style="font-size: 24px;"></i>
      <div>${sanitizeHTML(message)}</div>
    </div>
  `;

  document.body.appendChild(notification);
  console.log("✅ Success notification:", message);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

/**
 * Load all chat messages from API
 * @param {boolean} showLoader - Show loading indicator (default: true)
 */
async function loadChats(showLoader = true) {
  if (!DOM.chatBox) {
    console.warn("⚠️ Chat box element not found");
    return;
  }

  try {
    // Show loading indicator
    if (showLoader) {
      DOM.chatBox.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #888;">
          <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem;"></i>
          <div style="margin-top: 1rem;">Memuat percakapan...</div>
        </div>
      `;
    }

    const response = await fetch("/api/chats");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const chats = await response.json();
    
    // Clear chat box
    DOM.chatBox.innerHTML = "";

    // Render all messages
    if (chats.length === 0) {
      DOM.chatBox.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #888;">
          <i class="fas fa-comments" style="font-size: 2rem;"></i>
          <div style="margin-top: 1rem;">Belum ada percakapan. Mulai chat sekarang!</div>
        </div>
      `;
    } else {
      chats.forEach(chat => {
        renderChat(
          chat.message,
          chat.created_at,
          chat.user_id === userId,
          chat.user_id
        );
      });
      console.log(`💬 Loaded ${chats.length} messages`);
    }

  } catch (error) {
    console.error("❌ Error loading chats:", error);
    DOM.chatBox.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #e74c3c;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
        <div style="margin-top: 1rem;">Gagal memuat percakapan</div>
        <button onclick="loadChats()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent); color: white; border: none; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-redo"></i> Coba Lagi
        </button>
      </div>
    `;
    showErrorNotification("Gagal memuat percakapan. Periksa koneksi Anda.");
  }
}

/**
 * Send chat message to server
 * @returns {Promise<void>}
 */
async function sendChat() {
  if (!DOM.chatInput || !DOM.chatBox) return;

  const message = DOM.chatInput.value.trim();
  
  // Validate message
  if (!message) {
    DOM.chatInput.focus();
    return;
  }

  // Check message length
  if (message.length > 1000) {
    showErrorNotification("Pesan terlalu panjang. Maksimal 1000 karakter.");
    return;
  }

  // Show temporary sending message
  const tempDiv = document.createElement("div");
  tempDiv.className = "chat user sending";
  tempDiv.innerHTML = `
    <div>${sanitizeHTML(message)}</div>
    <div class="chat-meta">
      <div class="chat-time">
        <i class="fas fa-circle-notch fa-spin loading-spinner"></i> Mengirim...
      </div>
    </div>
  `;
  
  DOM.chatBox.appendChild(tempDiv);
  scrollToBottom();

  // Clear input immediately for better UX
  const originalMessage = message;
  DOM.chatInput.value = "";
  DOM.chatInput.disabled = true;

  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: originalMessage,
        user_id: userId
      })
    });

    const data = await response.json();

    // Remove temporary message
    tempDiv.remove();

    if (!response.ok) {
      // Handle different error statuses
      if (response.status === 403) {
        // Content moderation blocked the message
        const errorMsg = data.reason || "Pesan mengandung konten yang tidak pantas";
        showErrorNotification(errorMsg, 7000);
        
        // Return message to input for editing
        DOM.chatInput.value = originalMessage;
        DOM.chatInput.focus();
        
        console.warn("🚫 Message blocked:", data);
      } else if (response.status === 429) {
        // Rate limit exceeded
        showErrorNotification("Terlalu banyak pesan. Tunggu sebentar.");
      } else {
        // Other errors
        showErrorNotification("Terjadi kesalahan saat mengirim pesan");
        DOM.chatInput.value = originalMessage;
      }
      return;
    }

    // Message sent successfully
    renderChat(originalMessage, new Date(), true, userId);
    showSuccessNotification("Pesan terkirim!", 2000);
    
    console.log("✅ Message sent successfully:", data);

  } catch (error) {
    console.error("❌ Error sending message:", error);
    
    // Remove temporary message
    if (tempDiv.parentElement) {
      tempDiv.remove();
    }

    // Network error handling
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showErrorNotification("Tidak ada koneksi internet. Periksa jaringan Anda.", 7000);
    } else {
      showErrorNotification("Gagal mengirim pesan. Coba lagi.");
    }
    
    // Return message to input
    DOM.chatInput.value = originalMessage;
    
  } finally {
    // Re-enable input
    DOM.chatInput.disabled = false;
    DOM.chatInput.focus();
  }
}

// Send message on Enter key
if (DOM.chatInput) {
  DOM.chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  });

  // Auto-resize textarea on input (if needed in future)
  DOM.chatInput.addEventListener("input", debounce(() => {
    // Placeholder for future auto-resize functionality
  }, 100));
}

// Typing indicator (placeholder for future enhancement)
let typingTimeout;
if (DOM.chatInput) {
  DOM.chatInput.addEventListener("input", () => {
    clearTimeout(typingTimeout);
    // Future: Send typing indicator to server
    typingTimeout = setTimeout(() => {
      // Future: Stop typing indicator
    }, 1000);
  });
}

const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds
let autoRefreshTimer;

function startAutoRefresh() {
  stopAutoRefresh(); // Clear any existing timer
  
  autoRefreshTimer = setInterval(() => {
    // Only refresh if user is not typing
    if (DOM.chatInput && DOM.chatInput === document.activeElement) {
      return; // Skip refresh while typing
    }
    
    loadChats(false); // Refresh without loader
    console.log("🔄 Auto-refreshing chats...");
  }, AUTO_REFRESH_INTERVAL);
  
  console.log(`⏰ Auto-refresh enabled (${AUTO_REFRESH_INTERVAL / 1000}s interval)`);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    console.log("⏰ Auto-refresh disabled");
  }
}

// Pause auto-refresh when page is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
    loadChats(false); // Refresh immediately when returning
  }
});

// INITIALIZE APPLICATION

function init() {
  console.log("🚀 Initializing Ilan Learning Platform...");
  
  // Load initial chats
  loadChats();
  
  // Start auto-refresh
  startAutoRefresh();
  
  // Set focus on chat input if exists
  if (DOM.chatInput) {
    DOM.chatInput.focus();
  }
  
  console.log("✅ Application initialized successfully");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.addEventListener("error", (event) => {
  console.error("❌ Global error:", event.error);
  showErrorNotification("Terjadi kesalahan aplikasi. Refresh halaman jika masalah berlanjut.");
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Unhandled promise rejection:", event.reason);
  showErrorNotification("Terjadi kesalahan. Coba lagi.");
});

window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.sendChat = sendChat;
window.loadChats = loadChats;