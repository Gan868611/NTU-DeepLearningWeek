import React, { useState } from "react";
import axios from "axios";
import useHealthData from "./HealthData";  // Import health data

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const healthData = useHealthData(); // ✅ Get user health data

  const sendMessage = async () => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: "user", content: input }];
    setMessages(updatedMessages);

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: input,
        healthInfo: healthData  // ✅ Send user health data with message
      });

      const botReply = response.data.reply;
      setMessages([...updatedMessages, { role: "assistant", content: botReply }]);
      setInput("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ margin: "20px" }}>
      <h2>Healthcare Chatbot</h2>
      <div style={{ border: "1px solid #ccc", height: "300px", overflowY: "scroll", padding: "10px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: "5px 0", textAlign: msg.role === "user" ? "right" : "left" }}>
            <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          style={{ width: "80%", padding: "10px" }}
        />
        <button onClick={sendMessage} style={{ padding: "10px" }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
