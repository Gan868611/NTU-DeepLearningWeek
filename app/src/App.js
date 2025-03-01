// src/App.js
import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import HealthProfile from "./components/HealthProfile";
import FoodRecognition from "./components/FoodRecognition";
import BattleStats from "./components/BattleStats";
import WeeklyBattle from "./components/WeeklyBattle";
import BottomNavBar from "./components/BottomNavBar";
import "./styles.css";

const App = () => {
  const [screen, setScreen] = useState("Dashboard");
  const [profile, setProfile] = useState(null);
  const [buffs, setBuffs] = useState([
    { name: "Strength", icon: "/icons/strength-buff.png", progress: 60 },
    { name: "Speed", icon: "/icons/speed-buff.png", progress: 80 },
  ]);

  const handleProfileSubmit = (data) => {
    setProfile(data);
    setScreen("Dashboard");
  };

  return (
    <div className="app">
      {screen === "Dashboard" && <Dashboard healthRisk="Low" buffs={buffs} countdown={12} />}
      {screen === "HealthProfile" && <HealthProfile onProfileSubmit={handleProfileSubmit} />}
      {screen === "FoodRecognition" && <FoodRecognition />}
      {screen === "BattleStats" && <BattleStats />}
      {screen === "WeeklyBattle" && <WeeklyBattle playerStats={buffs} monsterStats={{ health: 100 }} />}
      {/* Bottom Navigation Bar */}
      <BottomNavBar setScreen={setScreen} />
    </div>
  );
};

export default App;
