let chatVisible = false;
let cancelReply = false;

// ✅ 替换成你的 ngrok 地址
const API_URL = "http://localhost:5000/generate";

// ✅ 创建消息（仅用户使用 bubble）
function createMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const bubble = document.createElement("div");

  if (role === "user") {
    bubble.className = "bubble";
    bubble.innerHTML = marked.parse(text); // ✅ 用户支持 Markdown
  } else {
    bubble.textContent = text; // ✅ AI 回复是纯文本，不加 bubble
  }

  msg.appendChild(bubble);
  return msg;
}

// ✅ 发送消息逻辑
async function sendMessage() {
  const inputEl = document.getElementById("input");
  const input = inputEl.value.trim();
  if (!input) return;

  const chat = document.getElementById("chat");

  if (!chatVisible) {
    chat.style.display = "flex";
    document.getElementById("title").style.display = "none";
    document.getElementById("inputContainer").classList.add("bottom-input");
    chatVisible = true;
  }

  const userMsg = createMessage("user", input);
  chat.appendChild(userMsg);
  inputEl.value = "";
  chat.scrollTop = chat.scrollHeight;

  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message ai";
  const loadingBubble = document.createElement("div");
  loadingBubble.textContent = "...";
  loadingMsg.appendChild(loadingBubble);
  chat.appendChild(loadingMsg);
  chat.scrollTop = chat.scrollHeight;

  // ✅ 闪烁的“...”动画
  let visible = true;
  const blinkInterval = setInterval(() => {
    loadingBubble.style.visibility = visible ? "visible" : "hidden";
    visible = !visible;
  }, 1000);

  // ✅ 切换发送按钮为“取消”按钮
  const sendBtn = document.querySelector(".send-icon");
  sendBtn.innerHTML = `<span class="pause-symbol">☐</span>`;
  sendBtn.title = "Cancel response";
  sendBtn.classList.add("pause-mode");
  sendBtn.onclick = () => {
    cancelReply = true;
    clearInterval(blinkInterval);
    chat.removeChild(loadingMsg);
    restoreSendButton();
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();

    clearInterval(blinkInterval);
    if (!cancelReply) {
      chat.removeChild(loadingMsg);
      const aiMsg = createMessage("ai", data.response);
      chat.appendChild(aiMsg);
      chat.scrollTop = chat.scrollHeight;
    }
  } catch (error) {
    console.error("Request failed:", error);
    clearInterval(blinkInterval);
    chat.removeChild(loadingMsg);
    const errorMsg = createMessage("ai", "Sorry, the server is currently unavailable. Please try again later.");
    chat.appendChild(errorMsg);
    chat.scrollTop = chat.scrollHeight;
  }

  cancelReply = false;
  restoreSendButton();
}

// ✅ 恢复发送按钮样式
function restoreSendButton() {
  const sendBtn = document.querySelector(".send-icon");
  sendBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  `;
  sendBtn.title = "Send message";
  sendBtn.classList.remove("pause-mode");
  sendBtn.onclick = sendMessage;
}

// ✅ 重置聊天窗口
function resetChat() {
  document.getElementById("chat").innerHTML = "";
  document.getElementById("chat").style.display = "none";
  document.getElementById("title").style.display = "block";
  document.getElementById("inputContainer").classList.remove("bottom-input");
  document.getElementById("input").value = "";
  chatVisible = false;
}

// ✅ 支持按 Enter 发送消息（Shift+Enter 换行）
document.addEventListener("keydown", function (e) {
  const inputEl = document.getElementById("input");
  if (e.key === "Enter" && !e.shiftKey && document.activeElement === inputEl) {
    e.preventDefault();
    sendMessage();
  }
});
