import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import {
  TextField, Button, Box, Typography, AppBar, Toolbar
} from '@mui/material';

const socket = io('http://127.0.0.1:5000');

function ChatRoom() {
  const [room, setRoom] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState('');