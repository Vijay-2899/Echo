// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import ChatRoom from "./ChatRoom";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/chatroom" element={<ChatRoom/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;
