import React, { useState, useEffect } from 'react';
import './App.css'; // Import your CSS for overall layout
import { io } from 'socket.io-client'; // Import socket.io-client

// Import Material UI components
import { TextField, Button, Box, Typography, AppBar, Toolbar, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// Define some predefined rooms/contacts
const predefinedRooms = ['Ramya', 'Jerish', 'Daimy', 'Vijay', 'General Chat'];

// Initialize Socket.IO connection
// Make sure this matches your backend Flask server's address (e.g., http://localhost:5000)
const socket = io('https://python-websocket-chat.onrender.com'); // Assuming your Flask backend runs on port 5000

function App() {
    const [room, setRoom] = useState(''); // Can be set by typing or by selecting from dropdown
    const [displayName, setDisplayName] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [roomFeedback, setRoomFeedback] = useState('');