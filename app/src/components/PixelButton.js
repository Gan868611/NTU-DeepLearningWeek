// src/components/PixelButton.js
import React from "react";
import "../styles.css";

const PixelButton = ({ text, onClick }) => {
  return (
    <button className="pixel-button" onClick={onClick}>
      {text}
    </button>
  );
};

export default PixelButton;
