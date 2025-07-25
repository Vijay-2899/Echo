import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from "@mui/material";

const Login = () => {
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
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
      const res = await fetch('http://localhost:5000/login', {
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
      setMessage('Login successful!');
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/chatroom');
    } catch (err) {
      console.error('Login error:', err.message);
      setMessage(err.message);
    }
  };

  return (
    // <div className="p-8">
    //   <h2 className="text-xl font-bold">Login</h2>
    //   <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
    //     <input
    //       name="email"
    //       type="email"
    //       placeholder="Email"
    //       value={email}
    //       onChange={(e) => setEmail(e.target.value)}
    //       required
    //     />
    //     <input
    //       name="password"
    //       type="password"
    //       placeholder="Password"
    //       value={password}
    //       onChange={(e) => setPassword(e.target.value)}
    //       required
    //     />
    //     <button type="submit" className="bg-green-500 text-white px-4 py-1 rounded">
    //       Login
    //     </button>
    //   </form>
    //   <br />
    //   <br />
    //   <p className="mt-4">
    //     Don't have an account? <a href="/register" className="text-blue-500">Register here</a>
    //   </p>
    //   {message && <p className="mt-2 text-red-500">{message}</p>}
    // </div>
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
        Don't have an account? <a href="/register" className="text-blue-500">Register here</a>
      </Typography>
    </Box>
  );
};

export default Login;
