from flask import Flask, request, jsonify, session
from flask_cors import CORS
import openai
from datetime import timedelta

app = Flask(__name__)
CORS(app)

app.secret_key = "your_flask_secret_key_here"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.permanent_session_lifetime = timedelta(hours=1)  # Extend session duration

openai.api_key = "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"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")

    # Ensure session history exists
    if "history" not in session:
        session["history"] = []

    # Add user message to conversation history
    session["history"].append({"role": "user", "content": user_message})

    # Construct system prompt
    system_message = {
        "role": "system",
        "content": (
            "You are a helpful healthcare chatbot. You provide guidance based on previous interactions, "
            "but always remind users that you are not a substitute for a doctor."
        )
    }

    # Combine system message + entire chat history
    messages = [system_message] + session["history"]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        bot_reply = response["choices"][0]["message"]["content"]
    except Exception as e:
        bot_reply = f"Error: {str(e)}"

    # Add bot response to history
    session["history"].append({"role": "assistant", "content": bot_reply})

    return jsonify({"reply": bot_reply})

if __name__ == '__main__':
    # Run Flask app on port 5000 by default
    app.run(debug=True)
