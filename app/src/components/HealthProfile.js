import React, { useState } from "react";
import "./HealthProfile.css";

const HealthProfile = ({ onProfileSubmit }) => {
  const [profile, setProfile] = useState({
    age: 25,
    gender: "Male",
    family_history: "No known history",
    smoking: "Never smoked",
    exercise: "Moderate",
    alcohol: "Occasional",
  });

  const [riskLevel, setRiskLevel] = useState(null); // 🔹 Store backend response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const submitProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/health-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setRiskLevel(data.risk_level); // 🔹 Store the returned health risk level
      onProfileSubmit(profile); // 🔹 Update UI state in parent component
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch health risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="health-profile">
      <h2>Health Profile</h2>
      <p className="subtitle">Warrior Stats & Attributes</p>

      {/* Personal Information Section */}
      <div className="section">
        <h3>👤 Personal Information</h3>
        <label>Age</label>
        <input
          type="number"
          name="age"
          value={profile.age}
          onChange={handleChange}
          placeholder="Enter your age"
        />
        <label>Gender</label>
        <div className="radio-group">
          <input type="radio" name="gender" value="Male" checked={profile.gender === "Male"} onChange={handleChange} /> Male
          <input type="radio" name="gender" value="Female" checked={profile.gender === "Female"} onChange={handleChange} /> Female
          <input type="radio" name="gender" value="Other" checked={profile.gender === "Other"} onChange={handleChange} /> Other
        </div>
      </div>

      {/* Health Factors Section */}
      <div className="section">
        <h3>⚕️ Health Factors</h3>
        <label>Family History of Heart Disease</label>
        <select name="familyHistory" value={profile.familyHistory} onChange={handleChange}>
          <option>No known history</option>
          <option>One parent</option>
          <option>Both parents</option>
        </select>

        <label>Smoking Status</label>
        <select name="smoking" value={profile.smoking} onChange={handleChange}>
          <option>Never smoked</option>
          <option>Former smoker</option>
          <option>Current smoker</option>
        </select>

        <label>Exercise Level</label>
        <select name="exercise" value={profile.exercise} onChange={handleChange}>
          <option>Sedentary</option>
          <option>Light</option>
          <option>Moderate</option>
          <option>Active</option>
        </select>

        <label>Alcohol Consumption</label>
        <select name="alcohol" value={profile.alcohol} onChange={handleChange}>
          <option>None</option>
          <option>Occasional</option>
          <option>Frequent</option>
        </select>
      </div>

      {/* Update Profile Button */}
      <button className="update-btn" onClick={submitProfile} disabled={loading}>
        {loading ? "Calculating..." : "Update Profile"}
      </button>

      {error && <p className="error-message">{error}</p>}
      <div style={{ marginBottom: "50px" }}></div>

      {/* Display Health Risk Level from Backend */}
      {riskLevel && (
        <div className="section">
          <h3>🛡️ Your Health Risk Level</h3>
          <p className={`risk-level ${riskLevel.toLowerCase()}`}>{riskLevel}</p>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;
