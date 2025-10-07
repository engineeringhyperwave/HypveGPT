let chatVisible = false;
let cancelReply = false;

function createMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msg.appendChild(bubble);
  return msg;
}

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

  const loadingMsg = createMessage("ai", "...");
  chat.appendChild(loadingMsg);
  chat.scrollTop = chat.scrollHeight;

  // Blinking "..." bubble
  const bubble = loadingMsg.querySelector(".bubble");
  let visible = true;
  const blinkInterval = setInterval(() => {
    bubble.style.visibility = visible ? "visible" : "hidden";
    visible = !visible;
  }, 1000);

  // Transform send button into square Pause button with ☐
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
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();

    clearInterval(blinkInterval);
    if (!cancelReply) {
      chat.removeChild(loadingMsg);
      const aiMsg = createMessage("ai", data.reply);
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

function resetChat() {
  document.getElementById("chat").innerHTML = "";
  document.getElementById("chat").style.display = "none";
  document.getElementById("title").style.display = "block";
  document.getElementById("inputContainer").classList.remove("bottom-input");
  document.getElementById("input").value = "";
  chatVisible = false;
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
