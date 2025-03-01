import React from "react";
import ProfileProvider from "./ProfileContext";  // ✅ Import ProfileProvider
import Chatbot from "./Chatbot";  

function App() {
  return (
    <ProfileProvider>  {/* ✅ Wrap the entire app */}
      <Chatbot />
    </ProfileProvider>
  );
}

export default App;
