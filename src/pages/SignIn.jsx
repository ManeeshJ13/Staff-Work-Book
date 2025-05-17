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
  const [passwordModifiedDirectly, setPasswordModifiedDirectly] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Update password when name changes only if password hasn't been directly modified
  useEffect(() => {
    if (!passwordModifiedDirectly) {
      setPassword(name);
    }
  }, [name, passwordModifiedDirectly]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordModifiedDirectly(true);
  };

  const handleNameChange = (event, newValue) => {
    setName(newValue || "");
    
    // If name is changed after directly modifying password, reset the flag
    // so password will sync with name again
    setPasswordModifiedDirectly(false);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    console.log("Sign-in attempt for:", name);
    console.log("Available staff:", staffList);

    const admin_cred = {
      username: "admin",
      password: "admin"
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

  // Create options list for Autocomplete including admin
  const staffOptions = ["admin", ...staffList.map(staff => staff.Staff_Name)];

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
                  helperText="Type or select your name"
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
              freeSolo
              selectOnFocus
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
              helperText="Your password is your name"
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