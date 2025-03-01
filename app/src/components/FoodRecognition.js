// src/components/FoodRecognition.js
import React, { useState } from "react";
import PixelButton from "./PixelButton";
import "../styles.css";

const FoodRecognition = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
    setTimeout(() => setResult("Healthy Food! 🥦✨"), 1500);
  };

  return (
    <div className="food-recognition">
      <h2 className="pixel-font">🍽️ Upload Your Meal</h2>
      <input type="file" onChange={handleUpload} />
      {image && <img src={image} alt="Food" className="food-preview" />}
      {result && <p className="food-result">{result}</p>}
    </div>
  );
};

export default FoodRecognition;
