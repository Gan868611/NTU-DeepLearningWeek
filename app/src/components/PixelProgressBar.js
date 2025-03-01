// src/components/PixelProgressBar.js
import React from "react";
import "../styles.css";

const PixelProgressBar = ({ value }) => {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%` }}></div>
    </div>
  );
};

export default PixelProgressBar;
