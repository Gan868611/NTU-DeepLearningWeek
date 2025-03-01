// src/components/Monster.js
import React from "react";
import strongMonster from "../assets/sprites/monster-strong.png";
import weakMonster from "../assets/sprites/monster-weak.png";
import "../styles.css";

const Monster = ({ healthRisk }) => {
  const sprite = healthRisk === "High" ? weakMonster : weakMonster;
  return(
    <div className="monster-glow"> 
        <img src={sprite} alt="Monster" className="character-sprite" />
    </div>
  );
};

export default Monster;
