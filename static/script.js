let chatVisible = false;
let cancelReply = false;

// ✅ 替换成你的 ngrok 地址或者本地地址
const API_URL = "https://ungesticular-pretendedly-noelia.ngrok-free.dev/generate";

// 创建消息节点，用户支持 Markdown，AI 为纯文本
function createMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (role === "user") {
    // 用户消息支持 Markdown
    bubble.innerHTML = marked.parse(text);
  } else {
    // AI 消息纯文本，防止 XSS
    bubble.textContent = text;
  }

  msg.appendChild(bubble);
  return msg;
}

// 发送消息主逻辑
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

  // 显示用户消息
  const userMsg = createMessage("user", input);
  chat.appendChild(userMsg);
  inputEl.value = "";
  chat.scrollTop = chat.scrollHeight;

  // 显示加载中的 AI 消息
  const loadingMsg = createMessage("ai", "...");
  chat.appendChild(loadingMsg);
  chat.scrollTop = chat.scrollHeight;

  // “...”闪烁动画
  const bubble = loadingMsg.querySelector(".bubble");
  let visible = true;
  const blinkInterval = setInterval(() => {
    bubble.style.visibility = visible ? "visible" : "hidden";
    visible = !visible;
  }, 1000);

  // 发送按钮变成“取消”按钮
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
      body: JSON.stringify({ prompt: input }) // ⚠️ 注意这里是 prompt 字段
    });

    const data = await res.json();

    clearInterval(blinkInterval);

    if (!cancelReply) {
      chat.removeChild(loadingMsg);
      const aiMsg = createMessage("ai", data.response); // ⚠️ 返回字段是 response
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

// 恢复发送按钮样式和事件
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

// 重置聊天窗口
function resetChat() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";
  chat.style.display = "none";
  document.getElementById("title").style.display = "block";
  document.getElementById("inputContainer").classList.remove("bottom-input");
  document.getElementById("input").value = "";
  chatVisible = false;
}

// 支持按 Enter 发送消息，Shift+Enter 换行
document.addEventListener("keydown", function (e) {
  const inputEl = document.getElementById("input");
  if (e.key === "Enter" && !e.shiftKey && document.activeElement === inputEl) {
    e.preventDefault();
    sendMessage();
  }
});
