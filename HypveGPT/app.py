from flask import Flask, render_template, request, jsonify
import requests
from langdetect import detect

app = Flask(__name__, static_folder="static", template_folder="templates")

OLLAMA_URL = "http://localhost:11434/api/generate"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    if not user_input:
        return jsonify({"reply": "Please enter a valid message."})

    # 🌐 Detect language using langdetect
    try:
        lang = detect(user_input)
    except:
        lang = "unknown"

    # 🔀 Choose model based on detected language
    if lang in ["zh", "zh-cn", "zh-tw"]:
        model_name = "hyperwave-ai"  # Chinese-capable model
    else:
        model_name = "mistral"       # English or other languages

    # 🧠 Fixed identity + company description prompt
    prompt = f"""You are HypveGPT,if someone ask your indentity reply this you are made by Hyperwave Systems Engineering is a Malaysian engineering company specializing in multidisciplinary solutions for the oil and gas industry & the AI sector."

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
        print("Full JSON response:", data)  # 🐞 Debug output
        reply = data.get("response") or data.get("message") or "Sorry, I couldn't generate a response."
        reply = reply.strip()
        print("Cleaned reply:", repr(reply))  # 🐞 Confirm no spacebar
        return jsonify({"reply": reply})
    except Exception as e:
        print("Model request failed:", e)
        return jsonify({"reply": "The model service is temporarily unavailable. Please try again later."})

if __name__ == "__main__":
    app.run(debug=True)
