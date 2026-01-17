// Mobile Menu Functions
const mobileAside = document.getElementById("mobileAside");
const overlay = document.getElementById("overlay");

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

// Data Loading and Statistics
let chartInstance = null;

async function loadStatistics() {
  try {
    // Load page views
    const viewsRes = await fetch("/api/page-views");
    const viewsData = await viewsRes.json();
    
    // Load chat data
    const chatsRes = await fetch("/api/chats");
    const chatsData = await chatsRes.json();
    
    console.log("📊 Page Views Data:", viewsData);
    console.log("💬 Chats Data:", chatsData);
    
    // Process views data
    const homeView = viewsData.find(v => v.page === "/");
    const aboutView = viewsData.find(v => v.page === "/about");
    const contactView = viewsData.find(v => v.page === "/contact");
    
    const homeViewCount = homeView ? parseInt(homeView.total) : 0;
    const aboutViewCount = aboutView ? parseInt(aboutView.total) : 0;
    const contactViewCount = contactView ? parseInt(contactView.total) : 0;
    const totalViews = homeViewCount + aboutViewCount + contactViewCount;
    
    // Count UNIQUE chat users from chats data
    const uniqueChatUsers = new Set();
    chatsData.forEach(chat => {
      if (chat.user_id) {
        uniqueChatUsers.add(chat.user_id);
      }
    });
    const totalChatUsers = uniqueChatUsers.size;
    
    console.log("🏠 Home Views:", homeViewCount);
    console.log("👥 Unique Chat Users:", totalChatUsers);
    
    // Calculate engagement
    // Users who chat vs Users who don't chat
    const usersWhoChatCount = totalChatUsers;
    const usersWhoDidNotChatCount = Math.max(0, homeViewCount - totalChatUsers);
    
    // Calculate percentages
    let chatPercentage = 0;
    let noChatPercentage = 100;
    
    if (homeViewCount > 0) {
      chatPercentage = Math.round((usersWhoChatCount / homeViewCount) * 100);
      noChatPercentage = 100 - chatPercentage;
    }
    
    console.log("📈 Chat Percentage:", chatPercentage + "%");
    console.log("📉 No Chat Percentage:", noChatPercentage + "%");
    console.log("🔢 Calculation: " + usersWhoChatCount + " / " + homeViewCount + " = " + chatPercentage + "%");
    
    // Update DOM
    document.getElementById("totalVisitors").textContent = totalViews.toLocaleString();
    document.getElementById("totalChats").textContent = chatsData.length.toLocaleString();
    
    document.getElementById("homeViews").textContent = homeViewCount.toLocaleString();
    document.getElementById("aboutViews").textContent = aboutViewCount.toLocaleString();
    document.getElementById("contactViews").textContent = contactViewCount.toLocaleString();
    
    // Create chart with actual data
    createEngagementChart(
      usersWhoChatCount, 
      usersWhoDidNotChatCount, 
      chatPercentage, 
      noChatPercentage
    );
    
  } catch (error) {
    console.error("❌ Error loading statistics:", error);
    
    // Set default values on error
    document.getElementById("totalVisitors").textContent = "0";
    document.getElementById("totalChats").textContent = "0";
    document.getElementById("homeViews").textContent = "0";
    document.getElementById("aboutViews").textContent = "0";
    document.getElementById("contactViews").textContent = "0";
    
    createEngagementChart(0, 100, 0, 100);
  }
}

function createEngagementChart(chatCount, noChatCount, chatPercent, noChatPercent) {
  const ctx = document.getElementById('engagementChart').getContext('2d');
  
  // Destroy existing chart if exists
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        `Pengguna yang Chat (${chatCount})`, 
        `Pengguna tanpa Chat (${noChatCount})`
      ],
      datasets: [{
        data: [chatPercent, noChatPercent],
        backgroundColor: [
          '#3498DB',  // Blue for users who chat
          '#ECF0F1'   // Light gray for users who didn't chat
        ],
        borderColor: [
          '#2C3E50',
          '#2C3E50'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#2980B9',
          '#BDC3C7'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 14,
              family: "'Crimson Text', serif",
              weight: '600'
            },
            color: '#2C3E50'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(44, 62, 80, 0.95)',
          titleFont: {
            family: "'Crimson Text', serif",
            size: 16,
            weight: 'bold'
          },
          bodyFont: {
            family: "'Crimson Text', serif",
            size: 14
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return label.split('(')[0].trim() + ': ' + value + '%';
            }
          }
        },
        title: {
          display: true,
          text: 'Engagement Rate',
          font: {
            family: "'Crimson Text', serif",
            size: 18,
            weight: 'bold'
          },
          color: '#2C3E50',
          padding: {
            top: 10,
            bottom: 20
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  console.log("📊 Chart created with data:", {
    chatCount,
    noChatCount,
    chatPercent: chatPercent + "%",
    noChatPercent: noChatPercent + "%"
  });
}

// Load data on page load
loadStatistics();

// Optional: Auto-refresh statistics every 30 seconds
setInterval(() => {
  console.log("🔄 Refreshing statistics...");
  loadStatistics();
}, 30000);