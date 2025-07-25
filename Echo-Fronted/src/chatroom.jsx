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

  const clientPrivRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const roomKeyRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    generateKeyPair();

    socket.on('server_public_key', async ({ derived_key }) => {
      const rawKeyBytes = Uint8Array.from(atob(derived_key), c => c.charCodeAt(0));
      sharedKeyRef.current = await crypto.subtle.importKey(
        'raw',
        rawKeyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      console.log('[Client] Shared key imported from server.');
    });