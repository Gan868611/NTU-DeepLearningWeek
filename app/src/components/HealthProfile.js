import React, { useContext, useState } from "react";
import { ProfileContext } from "./ProfileContext";
import "./HealthProfile.css";

const HealthProfile = () => {
  const { profile, updateProfile, clearProfile } = useContext(ProfileContext);
  const [riskScore, setRiskScore] = useState(null);
  const [riskCategory, setRiskCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    updateProfile({ ...profile, [e.target.name]: e.target.value });
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
      setRiskScore(data.risk_score);
      setRiskCategory(data.risk_category);
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
        <input type="number" name="age" value={profile.age} onChange={handleChange} placeholder="Enter your age" />

        <label>Weight (kg)</label>
        <input type="number" name="weight" value={profile.weight} onChange={handleChange} placeholder="Enter your weight in kg" />

        <label>Height (cm)</label>
        <input type="number" name="height" value={profile.height} onChange={handleChange} placeholder="Enter your height in cm" />

        <label>BMI (Auto-calculated)</label>
        <input type="text" value={profile.bmi} readOnly />

        <label>Age Category (Auto-determined)</label>
        <input type="text" value={profile.age_category} readOnly />

        <label>Sex</label>
        <select name="sex" value={profile.sex} onChange={handleChange}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>

      {/* Health Factors Section */}
      <div className="section">
        <h3>⚕️ Health Factors</h3>

        <label>Exercise Level</label>
        <select name="exercise" value={profile.exercise} onChange={handleChange}>
          <option>No Exercise</option>
          <option>Light</option>
          <option>Moderate</option>
          <option>Active</option>
        </select>

        <label>Smoking History</label>
        <select name="smoking_history" value={profile.smoking_history} onChange={handleChange}>
          <option>Never smoked</option>
          <option>Former smoker</option>
          <option>Current smoker</option>
        </select>

        <label>Alcohol Consumption (Days per Month)</label>
        <input type="number" name="alcohol_days" value={profile.alcohol_days} onChange={handleChange} placeholder="Enter number of drinking days" />
      </div>

      {/* Medical History Section */}
      <div className="section">
        <h3>🏥 Medical History</h3>
        <label>Skin Cancer</label>
        <select name="skin_cancer" value={profile.skin_cancer} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Other Cancer</label>
        <select name="other_cancer" value={profile.other_cancer} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Depression</label>
        <select name="depression" value={profile.depression} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Arthritis</label>
        <select name="arthritis" value={profile.arthritis} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Pre-Diabetes</label>
        <select name="pre_diabetes" value={profile.pre_diabetes} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Diabetes</label>
        <select name="diabetes" value={profile.diabetes} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>

        <label>Pregnancy-Related Diabetes</label>
        <select name="pregnancy_diabetes" value={profile.pregnancy_diabetes} onChange={handleChange}>
          <option>No</option>
          <option>Yes</option>
        </select>
      </div>

      {/* Update Profile Button */}
      <button className="update-btn" onClick={submitProfile} disabled={loading}>
        {loading ? "Calculating..." : "Update Profile"}
      </button>

      {error && <p className="error-message">{error}</p>}
      <div style={{ marginBottom: "10px" }}></div>

      {/* Display Health Risk Score */}
      {riskScore !== null && (
        <div className="section">
          <h3>🛡️ Your Health Risk Level</h3>
          <p className={`risk-level ${riskCategory.toLowerCase()}`}>{riskCategory} ({riskScore})</p>
        </div>
      )}

      {/* Reset Profile Button */}
      <button className="reset-btn" onClick={clearProfile}>
        Reset Profile
      </button>

      <div style={{ marginBottom: "80px" }}></div>
    </div>
  );
};

export default HealthProfile;
