from flask import Flask, request, jsonify, session
from flask_cors import CORS
import openai
import os
from datetime import timedelta
from flask_session import Session

app = Flask(__name__)

openai.api_key = os.environ.get("OPENAI_API_KEY")
if not openai.api_key:
    print("⚠️ OpenAI API Key is missing! Please set the environment variable.")

# ✅ Ensure Flask Session Uses File System
app.config["SESSION_TYPE"] = "filesystem"  # Store sessions in a file
app.config["SESSION_FILE_DIR"] = "./flask_sessions"  # Explicit session directory
app.config["SESSION_PERMANENT"] = True  # Keep session data for a day
app.config["SESSION_USE_SIGNER"] = True  # Secure session storage
app.config["SESSION_KEY_PREFIX"] = "chatbot:"
app.secret_key = "your_flask_secret_key_here"
app.permanent_session_lifetime = timedelta(days=1)

# ✅ Create the session directory if it doesn't exist
if not os.path.exists(app.config["SESSION_FILE_DIR"]):
    os.makedirs(app.config["SESSION_FILE_DIR"])

Session(app)

CORS(app, supports_credentials=True)

# Replace with your own secret key
app.secret_key = "your_flask_secret_key_here"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    health_info = data.get("healthInfo", {})

    print(f"📢 Chatbot Received Profile Data: {health_info}")  # Debugging

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
            f"Sex: {health_info.get('sex', 'Unknown')}\n"
            f"Weight: {health_info.get('weight', 'Unknown')}\n"
            f"Height: {health_info.get('height', 'Unknown')}\n"
            f"BMI: {health_info.get('bmi', 'Unknown')}\n"
            f"Exercise count per week: {health_info.get('exercise', 'Unknown')}\n"
            f"Sleep Hours: {health_info.get('sleep_hours', 'Unknown')}\n"
            f"Smoking History: {health_info.get('smoking_history', 'Unknown')}\n"
            f"Alcohol Consumption: {health_info.get('alcohol_days', 'Unknown')} days per month\n"
            f"Diabetes Status: {health_info.get('diabetes_status', 'Unknown')}\n"
            f"Cancer History: {health_info.get('cancer_history', 'Unknown')}\n"
            f"Heart Disease Risk Score: {health_info.get('risk_score', 'Unknown')}\n"
            f"Meal Log: {health_info.get('mealLog', 'Unknown')}\n"
            f"Depression: {health_info.get('depression', 'Unknown')}\n"
            f"Arthritis: {health_info.get('arthritis', 'Unknown')}\n"
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

PORT = int(os.environ.get("PORT", 5002))  # Use Railway's assigned port

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
