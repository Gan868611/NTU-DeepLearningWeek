// src/components/Character.js
import React from "react";
import happySprite from "../assets/sprites/character-happy.png";
import sadSprite from "../assets/sprites/character-sad.png";

const Character = ({ healthRisk }) => {
  const sprite = healthRisk === "High" ? sadSprite : happySprite;
  return (
    <div className="character-glow">
      <img src={sprite} alt="Character" className="character-sprite" />
    </div>
  );
};

export default Character;
