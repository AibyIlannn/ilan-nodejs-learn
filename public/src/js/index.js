console.log("Connect to js");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const mobileAside = document.getElementById("mobileAside");
const overlay = document.getElementById("overlay");
document.getElementById('displayUserId').textContent = userId;

// Menu Functions
function openMenu() {
  mobileAside.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  mobileAside.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Chat Functions
let userId = localStorage.getItem("user_id");
if (!userId) {
  userId = Math.random().toString(36).substring(2, 8);
  localStorage.setItem("user_id", userId);
}

function formatTime(time) {
  const date = new Date(time);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderChat(message, time, isUser, chatUserId) {
  const div = document.createElement("div");
  div.className = `chat ${isUser ? "user" : "other"}`;

  div.innerHTML = `
    <div>${message}</div>
    <div class="chat-meta">
      <div class="chat-time">
        <i class="fas fa-clock"></i> ${formatTime(time)}
      </div>
      <div class="chat-id">
        <i class="fas fa-fingerprint"></i> ${chatUserId || 'system'}
      </div>
    </div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showErrorNotification(message) {
  const notification = document.createElement("div");
  notification.className = "error-notification";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(238, 90, 111, 0.3);
    z-index: 10000;
    font-family: 'Crimson Text', serif;
    font-size: 16px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <i class="fa-solid fa-exclamation-circle" style="font-size: 24px;"></i>
      <div>
        <div style="font-weight: 700; margin-bottom: 4px;">Pesan Ditolak</div>
        <div style="font-size: 14px; opacity: 0.95;">${message}</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

async function loadChats() {
  try {
    const res = await fetch("/api/chats");
    const chats = await res.json();
    chatBox.innerHTML = "";

    chats.forEach(chat => {
      renderChat(
        chat.message,
        chat.created_at,
        chat.user_id === userId,
        chat.user_id
      );
    });
  } catch (error) {
    console.error("Error loading chats:", error);
    showErrorNotification("Gagal memuat percakapan");
  }
}

async function sendChat() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Tampilkan pesan sementara
  const tempDiv = document.createElement("div");
  tempDiv.className = "chat user sending";
  tempDiv.innerHTML = `
    <div>${message}</div>
    <div class="chat-time">
      <i class="fa-solid fa-circle-notch fa-spin"></i> Mengirim...
    </div>
  `;
  chatBox.appendChild(tempDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  chatInput.value = "";

  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        user_id: userId
      })
    });

    const data = await response.json();

    // Hapus pesan sementara
    tempDiv.remove();

    if (!response.ok) {
      // Pesan ditolak
      if (response.status === 403) {
        const errorMsg = data.reason || "Pesan mengandung konten yang tidak pantas";
        showErrorNotification(errorMsg);
        
        // Kembalikan teks ke input
        chatInput.value = message;
      } else {
        showErrorNotification("Terjadi kesalahan saat mengirim pesan");
      }
      return;
    }

    // Pesan berhasil dikirim
    renderChat(message, new Date(), true, userId);

  } catch (error) {
    console.error("Error sending chat:", error);
    tempDiv.remove();
    showErrorNotification("Gagal mengirim pesan. Periksa koneksi Anda.");
    chatInput.value = message; // Kembalikan teks
  }
}

chatInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    sendChat();
  }
});

// Tambahkan CSS animation untuk notifikasi
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .chat.sending {
    opacity: 0.6;
  }

  .chat.sending .chat-time {
    color: #888;
    font-style: italic;
  }
`;
document.head.appendChild(style);

loadChats();