import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Material-UI imports
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

const SignIn = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch staff list from Supabase on component mount
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const { data, error } = await supabase
          .from("Staff List")
          .select("Staff_Name, hourly_rate");

        if (error) {
          console.error("Error fetching staff list:", error);
          setError("Failed to load staff data. Please try again later.");
        } else {
          console.log("Staff data fetched:", data);
          setStaffList(data);
        }
      } catch (err) {
        console.error("Exception while fetching staff:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffList();
  }, []);

  const handleSignIn = (e) => {
    e.preventDefault();
    console.log("Sign-in attempt for:", name);
    console.log("Available staff:", staffList);

    const admin_cred = {
      username: "Jameskutty Antony",
      password: "admin123"
    };

    // Check for admin credentials
    if (name === admin_cred.username && password === admin_cred.password) {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("currentStaff", name);
      navigate("/admindash");
      return;
    }

    // Check for staff credentials - using the actual Staff_Name property
    const isValidEmployee = staffList.some(
      (staff) =>
        staff.Staff_Name.toLowerCase() === name.toLowerCase() &&
        name.toLowerCase() === password.toLowerCase()
    );

    if (!isValidEmployee) {
      setError("Invalid credentials - use your name for both username and password");
      return;
    }

    localStorage.setItem("currentStaff", name);
    navigate("/staffdashboard");
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%"
          }}
        >
          <Avatar sx={{ mb: 2, bgcolor: "primary.main" }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Staff Sign In
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2, color: "primary.main" }}>
                Loading staff data...
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSignIn} sx={{ mt: 1, width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Your password is your name"
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                Sign In
              </Button>
              
              <Button
                component={Link}
                to="/"
                fullWidth
                variant="outlined"
                sx={{ mt: 1, mb: 2 }}
              >
                Back to Home
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default SignIn;