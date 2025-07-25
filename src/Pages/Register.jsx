import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from "@mui/material";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    otp: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    try {
      await axios.post("http://localhost:5000/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,

      });
      setStep(2);
      alert("OTP sent to your email.");
    } catch (error) {
      console.error("Send OTP Error:", error);
      alert(error.response?.data?.detail || "Failed to send OTP");
    }
  };

  const handleVerifyAndRegister = async () => {
    try {
      await axios.post("http://localhost:5000/verify-otp", {
        email: formData.email,
        password: formData.password,
        otp: formData.otp,
      });

      alert("Registration successful!");
      setFormData({ email: "", username: "", password: "", otp: "" });
      setStep(1);
      navigate("/login"); // Redirect to login page after successful registration
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.response?.data?.detail || "OTP verification or registration failed");
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
        Register
      </Typography>

      {step === 1 && (
        <>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendOtp}
            sx={{ mt: 2 }}
          >
            Send OTP
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <TextField
            label="Enter OTP"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            margin="normal"
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleVerifyAndRegister}
            sx={{ mt: 2 }}
          >
            Verify OTP & Register
          </Button>
        </>
      )}
    </Box>
  );
};

export default Register;
