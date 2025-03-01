// src/components/WeeklyBattle.js
import React, { useState } from "react";
import PixelButton from "./PixelButton";
import "../styles.css";

const WeeklyBattle = ({ playerStats, monsterStats }) => {
  const [message, setMessage] = useState("The battle begins!");

  const attack = () => {
    const success = Math.random() > 0.5;
    setMessage(success ? "You landed a hit! 🎯" : "Missed! 😢");
  };

  return (
    <div className="battle-screen">
      <h2 className="pixel-font">⚔️ Weekly Battle</h2>
      <p>{message}</p>
      <PixelButton text="Attack!" onClick={attack} />
    </div>
  );
};

export default WeeklyBattle;
