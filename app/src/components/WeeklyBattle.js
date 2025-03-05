// src/components/WeeklyBattle.js
import React, { useState, useContext} from "react";
import { ProfileContext } from "./ProfileContext";
import "../styles.css";

const API_BASE_URL = process.env.REACT_APP_GAME_API_BASE_URL || "http://127.0.0.1:8000";  // Fallback to localhost if not set

const WeeklyBattle = ({ playerStats, monsterStats }) => {
  const [message, setMessage] = useState("The battle begins!");
  const { profile } = useContext(ProfileContext);
  const [battleMode, setBattleMode] = useState(false); // Controls game visibility
  const [gameUrl, setGameUrl] = useState("");

  // Opens game in a new window or toggles iframe
  const launchGame = () => {
    setBattleMode(true);
  };

  const handleAttack = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: "GET",
        credentials: "include" // Maintain session cookies
      });

      // Send profile data to Flask server
      await fetch(`${API_BASE_URL}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
        credentials: "include" // Ensure session cookies are sent
      });

      // const response = await fetch(`${API_BASE_URL}/`, {
      //   method: "GET",
      //   credentials: "include" // Maintain session cookies
      // });
      const data = await response.json();
      
      if (data.game_url) {
        let secureGameUrl = data.game_url.replace(/^http:\/\//, "https://");
        setGameUrl(secureGameUrl);
        setBattleMode(true);
        console.log("Received game URL:", data.game_url);
      
        // Wait 2 seconds before calling resetGame() inside the iframe
        setTimeout(() => {
          const gameFrame = document.getElementById("gameFrame");
          if (gameFrame) {
            // Send a message to the iframe to trigger resetGame
            gameFrame.contentWindow.postMessage({ action: "resetGame" }, "*");
          }
        }, 2000);
      } else {
        console.error("Failed to get game URL from the server.");
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  return (
    <div className="battle-screen">
      <h2 className="pixel-font">⚔️ Weekly Battle</h2>
      <p>{message}</p>

      <button className="attack-btn" onClick={handleAttack}>
        ⚔️ Attack!
      </button>

      {battleMode && gameUrl && (
        <div className="game-container">
          <iframe
            src={gameUrl}
            id="gameFrame"
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
