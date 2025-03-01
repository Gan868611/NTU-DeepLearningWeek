// src/components/Dashboard.js
import React, { useContext } from "react";
import { ProfileContext } from "./ProfileContext";
import Character from "./Character";
import Monster from "./Monster";
import "../styles.css";

const Dashboard = ({ healthRisk, countdown }) => {
  const { profile } = useContext(ProfileContext);
  const healthRiskLevel = (profile.risk_score * 300) || 10; // Default value if not calculated yet
  const riskColor = healthRiskLevel < 40 ? "green" : healthRiskLevel < 70 ? "yellow" : "red";
  const riskText = healthRiskLevel < 40 ? "Low Risk - Keep it up!" : healthRiskLevel < 70 ? "Moderate Risk - Stay active!" : "High Risk - Take care!";

  // Compute Averages
  const avgHealthScore = profile.mealLog.length > 0
    ? profile.mealLog.reduce((sum, meal) => sum + meal.healthScore, 0) / profile.mealLog.length
    : 0.5; // Default 0.5 if no meal logs

  const avgSleepHours = profile.sleep_hours || 6; // Default to 6 if not set
  const avgExerciseHours = profile.exercise || 3; // Default to 3 if not set

  // 🔹 Compute Buff Level
  const weightedBuff = (avgHealthScore * 0.7) + 
                       ((avgSleepHours / 8) * 0.15) + 
                       ((avgExerciseHours / 5) * 0.15);
  
  const buffLevel = Math.round(weightedBuff * 15); // Scale to 15
  const buffLevelClamped = Math.max(0, Math.min(buffLevel, 15)); // Ensure it's between 0-15

  // Function to determine text color for Sleep & Exercise
  const getStatColor = (value, type) => {
    if (type === "sleep") return value < 5 ? "red-text" : value <= 7 ? "yellow-text" : "green-text";
    if (type === "exercise") return value < 2 ? "red-text" : value <= 5 ? "yellow-text" : "green-text";
  };

  return (
    <div className="dashboard">
      <h1>🏥 Health Tracker</h1>
      <Character healthRisk={profile.risk_score} />

      {/* Sleep & Exercise Stats Section */}
      <div className="stats-box-container">
        <div className="stats-box">
          <h3>🌙</h3>
          <p>Avg Sleep</p>
          <p className={getStatColor(avgSleepHours, "sleep")}>{weightedBuff} hrs</p>
        </div>
        <div className="stats-box">
          <h3>🏃</h3>
          <p>Avg Exercise</p>
          <p className={getStatColor(avgExerciseHours, "exercise")}>{avgExerciseHours} hrs</p>
        </div>
      </div>

      {/* Player Buff Level */}
      <div className="buff-level">
        <div className="buff-level-header">
          <h3>Player Buff Level</h3>
          <span className="shield-icon">⚡</span>
        </div>
        <div className="buff-progress">
          {Array.from({ length: 15 }).map((_, index) => (
            <div
              key={index}
              className={`buff-cell ${index < buffLevelClamped ? (buffLevelClamped < 4 ? "red" : buffLevelClamped < 10 ? "yellow" : "green") : ""}`}
            ></div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}></div>

      <Monster healthRisk={profile.risk_score} />

      {/* Health Risk Level Section */}
      <div className="health-risk">
        <div className="health-risk-header">
          <h3>Health Risk Level</h3>
          <span className="shield-icon">🛡️</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${riskColor}`} style={{ width: `${healthRiskLevel}%` }}></div>
        </div>
        <p className={`risk-text ${riskColor}`}>{riskText}</p>
        <p>Next Battle: {countdown} hrs</p>
      </div>

      <div style={{ marginBottom: "80px" }}></div>
    </div>
  );
};

export default Dashboard;
