import React, { createContext, useState, useEffect } from "react";

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const defaultProfile = {
    age: "",
    weight: "",
    height: "",
    bmi: "", // Auto-calculated
    age_category: "", // Auto-determined
    cancer_history: "No Cancer",
    diabetes_status: "No Diabetes",
    exercise: 6, // 🔹 Store exercise count (default 0)
    sleep_hours: 8, // 🔹 Store sleep hours (default 0)
    depression: "No",
    arthritis: "No",
    sex: "Male",
    smoking_history: "Never smoked",
    alcohol_days: "", // User enters days per month
    risk_score: null, // New state for Health Risk Score
    mealLog: [], // 🔹 New: Meal log storage
  };

  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) {
      setProfile(savedProfile);
    }
  }, []);

  const updateProfile = (newProfile) => {
    // Calculate BMI
    const weight = parseFloat(newProfile.weight);
    const height = parseFloat(newProfile.height) / 100; // Convert cm to meters
    const bmi = weight && height ? (weight / (height * height)).toFixed(1) : "";

    // Determine Age Category
    let age_category = "";
    const age = parseInt(newProfile.age);
    if (age >= 18 && age <= 24) age_category = "18-24";
    else if (age >= 25 && age <= 29) age_category = "25-29";
    else if (age >= 30 && age <= 34) age_category = "30-34";
    else if (age >= 35 && age <= 39) age_category = "35-39";
    else if (age >= 40 && age <= 44) age_category = "40-44";
    else if (age >= 45 && age <= 49) age_category = "45-49";
    else if (age >= 50 && age <= 54) age_category = "50-54";
    else if (age >= 55 && age <= 59) age_category = "55-59";
    else if (age >= 60 && age <= 64) age_category = "60-64";
    else if (age >= 65 && age <= 69) age_category = "65-69";
    else if (age >= 70 && age <= 74) age_category = "70-74";
    else if (age >= 75 && age <= 79) age_category = "75-79";
    else if (age >= 80) age_category = "80+";

    let skin_cancer = "No", other_cancer = "No";
    if (newProfile.cancer_history === "Skin Cancer") skin_cancer = "Yes";
    if (newProfile.cancer_history === "Other Cancer") other_cancer = "Yes";

    let pre_diabetes = "No", diabetes = "No", pregnancy_diabetes = "No";
    if (newProfile.diabetes_status === "Pre-Diabetes") pre_diabetes = "Yes";
    if (newProfile.diabetes_status === "Diabetes") diabetes = "Yes";
    if (newProfile.diabetes_status === "Pregnancy-Related Diabetes") pregnancy_diabetes = "Yes";

    const updatedProfile = { ...newProfile, bmi, age_category, skin_cancer, 
      other_cancer, pre_diabetes, diabetes, pregnancy_diabetes  };
    setProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
  };

  const updateRiskLevel = (risk_score) => {
    const updatedProfile = { ...profile, risk_score };
    setProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
  };

  const addMealToLog = (meal) => {
    const updatedMealLog = [meal, ...(profile.mealLog || [])]; // ✅ Ensure mealLog exists
    setProfile((prev) => ({ ...prev, mealLog: updatedMealLog }));
  };

  const updateSleepHours = (hours) => {
    setProfile((prev) => ({ ...prev, sleep_hours: hours }));
  };

  const updateExerciseCount = (count) => {
    setProfile((prev) => ({ ...prev, exercise: count }));
  };
  
  const clearMealLog = () => {
    setProfile((prev) => ({ ...prev, mealLog: [] }));
  };

  const clearProfile = () => {
    setProfile(defaultProfile);
    localStorage.removeItem("userProfile");
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, clearProfile, updateRiskLevel, 
    addMealToLog, clearMealLog, updateSleepHours, updateExerciseCount }}>
      {children}
    </ProfileContext.Provider>
  );
};
