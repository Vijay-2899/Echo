// App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import ChatRoom from './pages/chatroom';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chatroom" element={<ChatRoom />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
