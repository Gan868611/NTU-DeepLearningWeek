import React, { createContext, useState, useEffect } from "react";

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    age: 0,
    gender: "Male",
    family_history: "No known history",
    smoking: "Never smoked",
    exercise: "Moderate",
    alcohol: "Occasional"
  });

  // ✅ Load from localStorage when the app starts
  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) {
      setProfile(savedProfile);
    }
  }, []);

  // ✅ Save profile when updated
  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
  };


  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
