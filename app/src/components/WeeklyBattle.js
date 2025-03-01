// src/components/WeeklyBattle.js
import React, { useState } from "react";
import PixelButton from "./PixelButton";
import "../styles.css";

const WeeklyBattle = ({ playerStats, monsterStats }) => {
  const [message, setMessage] = useState("The battle begins!");
  const [battleMode, setBattleMode] = useState(false); // Controls game visibility

  // Opens game in a new window or toggles iframe
  const launchGame = () => {
    setBattleMode(true);
  };



  return (
    <div className="battle-screen">
      <h2 className="pixel-font">⚔️ Weekly Battle</h2>
      <p>{message}</p>
      {/* Attack Button */}
      <button className="attack-btn" onClick={launchGame}>⚔️ Attack!</button>

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
