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

     socket.on('room_key', async ({ iv, ciphertext }) => {
      console.group('[Client] room_key handler');
      try {
        const rawIv = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
        const rawCt = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const roomKeyRaw = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: rawIv },
          sharedKeyRef.current,
          rawCt
        );
        roomKeyRef.current = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(roomKeyRaw),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (err) {
        console.error('[Client] room_key error:', err);
      }
      console.groupEnd();
    });

    socket.on('receive_message', async ({ display_name, message }) => {
      if (!roomKeyRef.current) return;
      const { ciphertext, iv } = JSON.parse(message);
      const ct = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const ivArr = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
      try {
        const pt = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivArr },
          roomKeyRef.current,
          ct
        );
        const text = new TextDecoder().decode(pt);
        setMessages(m => [...m, { display_name, message: text }]);
      } catch (err) {
        console.error('Decrypt failed:', err);
      }
    });
