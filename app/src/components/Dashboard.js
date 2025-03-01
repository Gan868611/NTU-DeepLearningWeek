// src/components/Dashboard.js
import React from "react";
import Character from "./Character";
import "../styles.css";

const Dashboard = ({healthRisk, countdown}) => {
  const healthRiskLevel = 80; // Example risk level (adjust as needed)
  const riskText = healthRiskLevel > 70 ? "Low Risk - Keep it up!" : "Moderate Risk - Stay active!";

  return (
    <div className="dashboard">
      <h1>🏥 Health Tracker</h1>
      <Character healthRisk={healthRisk} />

      {/* Health Risk Level Section */}
      <div className="health-risk">
        <div className="health-risk-header">
          <h3>Health Risk Level</h3>
          <span className="shield-icon">🛡️</span> {/* Replace with an icon if needed */}
        </div>

        <div className="progress-bar">
          <div className="progress-fill health" style={{ width: `${healthRiskLevel}%` }}></div>
        </div>

        <p className="risk-text">{riskText}</p>
        <p>Next Battle: {countdown} hrs</p>
      </div>
    </div>
  );
};

export default Dashboard;
