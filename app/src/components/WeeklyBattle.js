// src/components/WeeklyBattle.js
import React, { useState, useContext} from "react";
import { ProfileContext } from "./ProfileContext";
import "../styles.css";

const WeeklyBattle = ({ playerStats, monsterStats }) => {
  const [message, setMessage] = useState("The battle begins!");
  const { profile } = useContext(ProfileContext);
  const [battleMode, setBattleMode] = useState(false); // Controls game visibility

  // Opens game in a new window or toggles iframe
  const launchGame = () => {
    setBattleMode(true);
  };

  const handleAttack = async () => {
    try {
      // Send profile data to Flask server
      await fetch("http://127.0.0.1:5000/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),  // 🔹 Send Profile Data
      });
  
      // Start the battle
      setBattleMode(true);
  
      // Wait 2 seconds before calling resetGame() inside the iframe
      setTimeout(() => {
        const gameFrame = document.getElementById("gameFrame");
        if (gameFrame && gameFrame.contentWindow && gameFrame.contentWindow.resetGame) {
          gameFrame.contentWindow.resetGame();
        } else {
          console.warn("resetGame() not found in iframe.");
        }
      }, 2000);
    } catch (error) {
      console.error("Error sending profile data:", error);
    }
  };

  return (
    <div className="battle-screen">
      <h2 className="pixel-font">⚔️ Weekly Battle</h2>
      <p>{message}</p>
      {/* Attack Button */}
      <button className="attack-btn" onClick={handleAttack}>⚔️ Attack!</button>

      {/* Render the Game in an IFrame when Attack is clicked */}
      {battleMode && (
        <div className="game-container">
          <iframe
            src="http://127.0.0.1:5000" // Adjust Flask Server URL if needed
            width="100%"
            height="600px"
            style={{ border: "none", marginTop: "20px" }}
            title="Battle Game"
          ></iframe>
        </div>
      )}
      <div style={{ marginBottom: "90px" }}></div>
    </div>

  );
};

export default WeeklyBattle;
