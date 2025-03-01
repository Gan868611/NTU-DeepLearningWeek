// src/components/BattleStats.js
import React from "react";
import "./BattleStats.css";

const BattleStats = () => {
  const victories = 24;
  const defeats = 8;
  const streak = 3; // Current streak (3 days)

  return (
    <div className="battle-stats">
      <h2>Battle Stats</h2>
      <p className="subtitle">Your Combat History</p>

      {/* Victory & Defeat Count */}
      <div className="stats-container">
        <div className="stat-box">
          <span className="trophy-icon">🏆</span>
          <h3>{victories}</h3>
          <p>Victories</p>
        </div>
        <div className="stat-box">
          <span className="target-icon">🎯</span>
          <h3>{defeats}</h3>
          <p>Defeats</p>
        </div>
      </div>

      {/* Current Streak Section */}
      <div className="streak-section">
        <h3>🔥 Current Streak</h3>
        <div className="streak-bar">
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <div key={index} className={`streak-dot ${index < streak ? "active" : ""}`}></div>
            ))}
        </div>
        <p>{streak} Win Streak</p>
      </div>
    </div>
  );
};

export default BattleStats;
