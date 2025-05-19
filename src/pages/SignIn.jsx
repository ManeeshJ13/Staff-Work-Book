import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Material-UI imports
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Avatar,
  useMediaQuery,
  useTheme,
  Autocomplete
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

const SignIn = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch staff list from Supabase on component mount
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const { data, error } = await supabase
          .from("Staff List")
          .select("Staff_Name, Password");

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

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleNameChange = (event, newValue) => {
    setName(newValue || "");
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    console.log("Sign-in attempt for:", name);

    // Check for admin credentials first - this works even if admin isn't in the dropdown
    if (name === "admin" && password === "admin") {
      console.log("Admin login successful");
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("currentStaff", "admin");
      navigate("/admindash");
      return;
    }

    // Check for staff credentials against the Password column in Staff List
    const staffMember = staffList.find(
      staff => staff.Staff_Name === name
    );

    if (!staffMember) {
      setError("Invalid username. Please select a valid staff name.");
      return;
    }

    if (staffMember.Password !== password) {
      setError("Incorrect password. Please try again.");
      return;
    }

    localStorage.setItem("currentStaff", name);
    navigate("/staffdashboard");
  };

  // Create options list for Autocomplete excluding admin
  const staffOptions = staffList.map(staff => staff.Staff_Name);

  return (
    <Container 
      component="main" 
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        px: { xs: 2, sm: 3 }, // Responsive padding
        overflow: 'hidden' // Prevent horizontal scrolling
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 2, sm: 4 }, // Responsive padding
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: isMobile 
            ? '0 4px 6px rgba(0,0,0,0.1)' 
            : '0 10px 15px rgba(0,0,0,0.1)'
        }}
      >
        <Avatar sx={{ 
          mb: 2, 
          bgcolor: "primary.main",
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 }
        }}>
          <LockOutlined fontSize={isMobile ? 'medium' : 'large'} />
        </Avatar>
        
        <Typography 
          component="h1" 
          variant={isMobile ? 'h6' : 'h5'} 
          sx={{ 
            mb: 3, 
            textAlign: 'center',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Staff Sign In
        </Typography>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            my: 4 
          }}>
            <CircularProgress size={isMobile ? 40 : 60} />
            <Typography 
              sx={{ 
                mt: 2, 
                color: "primary.main",
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Loading staff data...
            </Typography>
          </Box>
        ) : (
          <Box 
            component="form" 
            onSubmit={handleSignIn} 
            sx={{ 
              width: '100%', 
              mt: 1 
            }}
          >
            <Autocomplete
              id="staff-name-autocomplete"
              options={staffOptions}
              value={name}
              onChange={handleNameChange}
              fullWidth
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  margin="normal"
                  required
                  label="Staff Name" 
                  helperText="Select your name from the dropdown"
                  InputLabelProps={{
                    sx: {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                  inputProps={{
                    ...params.inputProps,
                    value: name, // Allow direct input even if not in options list
                    onChange: (e) => setName(e.target.value) // Handle direct text input
                  }}
                />
              )}
              sx={{
                mt: 1,
                '& .MuiAutocomplete-inputRoot': {
                  paddingRight: '14px !important', // Fix padding for dropdown icon
                },
                '& .MuiAutocomplete-option': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
              disableClearable
              autoComplete
              selectOnFocus
              freeSolo // This allows typing values not in the list (like 'admin')
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
              onChange={handlePasswordChange}
              helperText="Enter your password"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
              InputLabelProps={{
                sx: {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
              disabled={loading}
            >
              Sign In
            </Button>
            
            <Button
              component={Link}
              to="/"
              fullWidth
              variant="outlined"
              sx={{ 
                mt: 1, 
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Back to Home
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SignIn;