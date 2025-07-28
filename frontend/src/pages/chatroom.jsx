import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Box, Typography, AppBar, Toolbar
} from '@mui/material';

const socket = io('https://echo-chat-5cpj.onrender.com',{
  transports: ["polling", "websocket"],  // ✅ include polling
  withCredentials: true                 // ✅ since you're using cors_allowed_origins=["*"] or without credentials
});

function ChatRoom() {
  const navigate = useNavigate();

  const [room, setRoom] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState('');

  const clientPrivRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const roomKeyRef = useRef(null);


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

    socket.on('message', data => {
      if (data.msg) setFeedback(data.msg);
    });
    socket.on('connect', () => setFeedback('Connected to server'));
    socket.on('disconnect', () => setFeedback('Disconnected'));

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  const generateKeyPair = async () => {
    const kp = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-384' },
      true,
      ['deriveKey']
    );
    clientPrivRef.current = kp.privateKey;
    const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
    const pem = arrayBufferToPem(spki, 'PUBLIC KEY');
    socket.emit('client_public_key', { client_public_key: pem });
  };

  const handleJoinRoom = () => {
    if (!displayName || !room) return alert('Name + room required');
    socket.emit('join', { room, display_name: displayName });
    setMessages([]);
  };

  const handleLeaveRoom = () => {
    socket.emit('leave', { room, display_name: displayName });
    setRoom('');
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!roomKeyRef.current) return alert('Waiting for room key…');
    const ivArr = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode(message);
    const ctBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivArr },
      roomKeyRef.current,
      pt
    );
    const payload = {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ctBuf))),
      iv: btoa(String.fromCharCode(...ivArr))
    };
    socket.emit('send_message', {
      room,
      display_name: displayName,
      message: JSON.stringify(payload)
    });
    setMessage('');
  };

  function arrayBufferToPem(buffer, label) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = b64.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
  }

  return (
    <Box className="container">
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LetsChat
          </Typography>
          <Button
            color="inherit"
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="room-control" sx={{ backgroundColor: 'background.paper', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px', mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TextField
            label="Your Display Name"
            variant="outlined"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span role="img" aria-label="lock">🔒</span>
                </Box>
              )
            }}
            sx={{ minWidth: '180px' }}
          />

          <TextField
            label="Enter Room Name"
            variant="outlined"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            size="small"
            sx={{ minWidth: '180px' }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', mb: 1 }}>
          <Button variant="contained" onClick={handleJoinRoom}>Join Room</Button>
          <Button variant="outlined" onClick={handleLeaveRoom}>Leave Room</Button>
        </Box>

        <Typography id="room-feedback" sx={{ width: '100%', textAlign: 'center', mt: 1, color: 'primary.main' }}>
          {room ? `Current Room: ${room}. ` : ''}{feedback}
        </Typography>
      </Box>

      <Box component="section" className="chat-screen" sx={{ backgroundColor: 'background.default', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ padding: '15px 20px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'background.paper', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          Chat Room: {room || 'Not Joined'}
        </Typography>
        <Box
          className="messages"
          id="messages-box"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              className={`message ${msg.display_name === displayName ? 'my-message' : 'other-message'}`}
              sx={{
                maxWidth: '70%',
                padding: '8px 12px',
                borderRadius: '18px',
                marginBottom: '10px',
                wordBreak: 'break-word',
                alignSelf: msg.display_name === displayName ? 'flex-end' : 'flex-start',
                backgroundColor: msg.display_name === displayName ? '#DCF8C6' : '#FFFFFF',
                color: '#333',
                boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.13)',
              }}
            >
              <Typography component="strong" sx={{ display: 'block', marginBottom: '4px', color: '#075E54' }}>
                {msg.display_name}:
              </Typography>
              <Typography component="span" sx={{ fontSize: '1rem' }}>{msg.message}</Typography>
            </Box>
          ))}
        </Box>

        <Box className="message-input-area" sx={{ backgroundColor: 'background.paper', padding: '15px 20px', display: 'flex', gap: '15px', borderTop: '1px solid #e0e0e0', alignItems: 'center' }}>
          <TextField
            type="text"
            placeholder="Type your message..."
            fullWidth
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatRoom;