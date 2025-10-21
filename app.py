<<<<<<< HEAD
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv  # ✅ 1. 导入 dotenv

load_dotenv()  # ✅ 2. 加载 .env 文件中的变量

# 初始化 Flask 应用，指定静态文件和模板文件夹
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Hugging Face API 设置
API_URL = "https://router.huggingface.co/v1/chat/completions"
HF_API_KEY = os.environ.get("HF_API_KEY")  # ✅ 3. 从环境变量读取密钥

# 首页路由，渲染 index.html
@app.route("/")
def index():
    return render_template("index.html")

# 接收前端请求并调用 Hugging Face 模型
@app.route("/generate", methods=["POST"])
def generate():
    user_input = request.json.get("prompt")
    if not user_input:
        return jsonify({"response": "请输入有效的问题。"})

    messages = [
        {"role": "system", "content": "你是一个有趣、聪明、富有表现力的中文助手。请用清晰的结构、标题、表情符号来回答我，就像一个会聊天的朋友一样。"},
        {"role": "user", "content": user_input}
    ]

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}"
    }

    payload = {
        "model": "deepseek-ai/DeepSeek-V3.2-Exp",
        "messages": messages
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return jsonify({"response": reply})
    except Exception as e:
        print("调用失败:", e)
        return jsonify({"response": "❌ 模型服务暂时不可用，请稍后再试。"})

# 启动 Flask 应用（兼容本地和 Render）
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
=======
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
from langdetect import detect

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # ✅ 允许 GitHub Pages 前端访问

OLLAMA_URL = "http://localhost:11434/api/generate"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])  # ✅ 改为 /generate 路由
def generate():
    user_input = request.json.get("prompt")  # ✅ 改为 prompt 字段
    if not user_input:
        return jsonify({"response": "Please enter a valid prompt."})

    # 🌐 Detect language using langdetect
    try:
        lang = detect(user_input)
    except:
        lang = "unknown"

    # 🔀 Choose model based on detected language
    if lang in ["zh", "zh-cn", "zh-tw"]:
        model_name = "hyperwave-ai"
    else:
        model_name = "mistral"

    # 🧠 Identity prompt
    prompt = f"""You are HypveGPT,if someone ask your indentity reply this you are made by Hyperwave Systems Engineering is a Malaysian engineering company specializing in multidisciplinary solutions for the oil and gas industry & the AI sector.If no one asks, you don't need to mention it. The company's Chinese name is "海博威" and your Chinese name is "海博GPT,You are a model trained by Hyperwave.""

if nobody ask just reply I'm HypveGPT

User says: {user_input}
"""

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        reply = data.get("response") or data.get("message") or "Sorry, I couldn't generate a response."
        reply = reply.strip()
        return jsonify({"response": reply})  # ✅ 改为 response 字段
    except Exception as e:
        print("Model request failed:", e)
        return jsonify({"response": "The model service is temporarily unavailable. Please try again later."})

if __name__ == "__main__":
    app.run(port=5000, debug=True)  # ✅ 显式指定端口
>>>>>>> 4ccf9fdfae10f8ed4afdc935bc4fb599676745d9
