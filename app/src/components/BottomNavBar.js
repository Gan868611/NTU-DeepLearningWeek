// src/components/BottomNavBar.js
import React from "react";
import "./BottomNavBar.css";

const BottomNavBar = ({ setScreen }) => {
  return (
    <nav className="bottom-nav">
      <button onClick={() => setScreen("Dashboard")} title="Home">🏠</button>
      <button onClick={() => setScreen("HealthProfile")} title="Profile">🩺</button>
      <button onClick={() => setScreen("FoodRecognition")} title="Food">📸</button>
      <button onClick={() => setScreen("BattleStats")} title="Battle Stats">⚡</button>
      <button onClick={() => setScreen("WeeklyBattle")} title="Battle">⚔️</button>
    </nav>
  );
};

export default BottomNavBar;
