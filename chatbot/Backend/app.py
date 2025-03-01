from flask import Flask, request, jsonify, session
from flask_cors import CORS
import openai
import os
from datetime import timedelta
from flask_session import Session

app = Flask(__name__)
CORS(app)


openai.api_key = "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"

# Use filesystem for session storage
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_KEY_PREFIX"] = "chatbot:"

Session(app)

# Replace with your own secret key
app.secret_key = "your_flask_secret_key_here"
app.permanent_session_lifetime = timedelta(days=1)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    health_info = data.get("healthInfo", {})

    # Create or retrieve conversation history
    if "history" not in session:
        session["history"] = []

    # The primary system message that guides the model’s behavior
    system_role_message = {
        "role": "system",
        "content": (
            "You are a concise healthcare assistant. Only reference the user's health information if "
            "it is directly relevant to the user's question. Respond with short, factual answers. "
            "When uncertain, ask for clarification or recommend consulting a medical professional. "
            "Avoid giving overly lengthy or repetitive responses."
        )
    }

    # Append health data as a system message if this is the first time
    # or if the user has updated their info (you could detect updates however you wish).
    if "health_info_set" not in session or data.get("healthInfoUpdated", False):
        session["health_info_set"] = True

        health_data_prompt = (
            f"User's Health Data (for reference only):\n"
            f"Age: {health_info.get('age', 'Unknown')}\n"
            f"Weight: {health_info.get('weight', 'Unknown')}\n"
            f"Height: {health_info.get('height', 'Unknown')}\n"
            f"BMI: {health_info.get('bmi', 'Unknown')}\n"
            f"Exercise Level: {health_info.get('exercise', 'Unknown')}\n"
            f"Sleep Hours: {health_info.get('sleep_hours', 'Unknown')}\n"
            f"Smoking History: {health_info.get('smoking_history', 'Unknown')}\n"
            f"Alcohol Consumption: {health_info.get('alcohol_days', 'Unknown')} days per month\n"
            f"Diabetes Status: {health_info.get('diabetes_status', 'Unknown')}\n"
            f"Cancer History: {health_info.get('cancer_history', 'Unknown')}\n"
            f"Health Risk Score: {health_info.get('risk_score', 'Unknown')}\n"
            "\nUse this data only if relevant."
        )

        # Insert the health data as a system message
        session["history"].append({"role": "system", "content": health_data_prompt})

    # Append the user’s current question/message
    session["history"].append({"role": "user", "content": user_message})

    # Combine your main system instruction + the conversation history
    messages = [system_role_message] + session["history"]

    # Send to OpenAI
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages
        )
        bot_reply = response["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        bot_reply = "I'm sorry, but I'm having trouble processing your request."

    # Append the assistant’s response to the conversation
    session["history"].append({"role": "assistant", "content": bot_reply})

    return jsonify({"reply": bot_reply})

if __name__ == "__main__":
    app.run(debug=True)
