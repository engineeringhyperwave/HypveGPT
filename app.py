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
