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
     
    
    useEffect(() => {
        // Handle incoming messages
        socket.on('receive_message', (data) => {
            console.log("Message received:", data);
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        // Optional: Handle connection/disconnection feedback
        socket.on('connect', () => {
            console.log('Connected to Socket.IO backend');
            setRoomFeedback(prev => prev + (prev ? ' | ' : '') + 'Connected to server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO backend');
            setRoomFeedback(prev => prev + (prev ? ' | ' : '') + 'Disconnected from server');
        });

        socket.on('message', (data) => { // This listens for messages sent directly via send() in Flask
            console.log("Server message:", data);
            // This is typically for server-side messages like "user joined/left"
            if (data.msg) {
                setRoomFeedback(data.msg);
            }
        });

        return () => {
            socket.off('receive_message');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('message');
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    const handleJoinRoom = () => {
        if (!displayName.trim()) {
            alert('Please enter your Display Name first.');
            return;
        }
        if (!room.trim()) {
            alert('Please enter or select a Room name.');
            return;
        }

        // Emit 'join' event to the backend
        socket.emit('join', { room: room, display_name: displayName });
        setRoomFeedback(`Attempting to join room: ${room} as ${displayName}...`);
        setMessages([]); // Clear messages when attempting to join a new room
    };
