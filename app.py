from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from langdetect import detect  # 加入语言检测依赖

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# 这里环境变量读取 HuggingFace API KEY
HF_API_KEY = os.environ.get("HF_API_KEY")

# 本地 OLLAMA 模型地址
OLLAMA_URL = "http://localhost:11434/api/generate"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    user_input = request.json.get("prompt")
    if not user_input:
        return jsonify({"response": "请输入有效的问题。"})

    # 语言检测
    try:
        lang = detect(user_input)
    except:
        lang = "unknown"

    # 根据语言选择模型
    if lang in ["zh", "zh-cn", "zh-tw"]:
        model_name = "hyperwave-ai"
    else:
        model_name = "mistral"

    # 这里根据是否调用 HuggingFace 还是本地 Ollama，可以做判断
    # 比如你先用 HuggingFace 接口
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}"
    }
    messages = [
        {"role": "system", "content": "你是一个有趣、聪明、富有表现力的中文助手。请用清晰的结构、标题、表情符号来回答我，就像一个会聊天的朋友一样。"},
        {"role": "user", "content": user_input}
    ]
    payload_hf = {
        "model": "deepseek-ai/DeepSeek-V3.2-Exp",
        "messages": messages
    }

    try:
        # 先调用 HuggingFace 接口
        response = requests.post("https://router.huggingface.co/v1/chat/completions", headers=headers, json=payload_hf)
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return jsonify({"response": reply})
    except Exception as e:
        print("调用 HuggingFace 失败，尝试调用本地 Ollama 模型:", e)

    # 如果 HuggingFace 失败，调用本地 Ollama
    prompt = f"""You are HypveGPT,if someone ask your identity reply this you are made by Hyperwave Systems Engineering is a Malaysian engineering company specializing in multidisciplinary solutions for the oil and gas industry & the AI sector.If no one asks, you don't need to mention it. The company's Chinese name is "海博威" and your Chinese name is "海博GPT,You are a model trained by Hyperwave."

if nobody ask just reply I'm HypveGPT

User says: {user_input}
"""
    payload_ollama = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload_ollama)
        response.raise_for_status()
        data = response.json()
        reply = data.get("response") or data.get("message") or "抱歉，我无法生成回答。"
        reply = reply.strip()
        return jsonify({"response": reply})
    except Exception as e:
        print("调用本地 Ollama 失败:", e)
        return jsonify({"response": "模型服务暂时不可用，请稍后再试。"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
