import { useContext } from "react";
import { ProfileContext } from "./ProfileContext";  // Import Profile Context

const useHealthData = () => {
    const { profile } = useContext(ProfileContext);  // Get user health info

    return {
        name: "User",  // Default user name
        age: profile.age || "Unknown",
        weight: profile.weight || "Unknown",
        height: profile.height || "Unknown",
        bmi: profile.bmi || "Unknown",
        age_category: profile.age_category || "Unknown",
        exercise: profile.exercise || "No Exercise",
        sleep_hours: profile.sleep_hours || 8,
        diabetes_status: profile.diabetes_status || "No Diabetes",
        cancer_history: profile.cancer_history || "No Cancer",
        smoking_history: profile.smoking_history || "Never smoked",
        alcohol_days: profile.alcohol_days || "Unknown",
        risk_score: profile.risk_score || "Not calculated",
        mealLog: profile.mealLog || []
    };
};

export default useHealthData;
