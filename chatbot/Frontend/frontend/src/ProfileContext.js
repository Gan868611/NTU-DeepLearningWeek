import React, { createContext, useState, useEffect } from "react";

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {  // ✅ Ensure ProfileProvider is exported
  const defaultProfile = { 
    age: "", weight: "", height: "", bmi: "",
    age_category: "", exercise: "No Exercise",
    cancer_history: "No Cancer", diabetes_status: "No Diabetes",
    sleep_hours: 8, smoking_history: "Never smoked",
    alcohol_days: "", risk_score: null, mealLog: []
  };

  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) setProfile(savedProfile);
  }, []);

  const updateProfile = (newProfile) => {
    const weight = parseFloat(newProfile.weight);
    const height = parseFloat(newProfile.height) / 100;
    const bmi = weight && height ? (weight / (height * height)).toFixed(1) : "";
    
    const updatedProfile = { ...newProfile, bmi };
    setProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;  
