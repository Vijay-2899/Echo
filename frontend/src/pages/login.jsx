import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Typography, Box } from "@mui/material";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://echo-chat-5cpj.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      console.log('Login success:', data);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/chatroom');
    } catch (err) {
      console.error('Login error:', err.message);
    }
  };

  return (
    
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
          <TextField
            label="email"
            name="email"
            value={formData.email}
            margin="normal"
            onChange={handleChange}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            onChange={handleChange}
            value={formData.password}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            Submit
          </Button>
        
      <Typography variant="body2" sx={{ mt: 2 }}>
        Don't have an account? <Link to="/register" className="text-blue-500">Register here</Link>
      </Typography>
    </Box>
  );
};

export default Login;