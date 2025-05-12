import React from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import { 
  Box,
  Typography,
  Button,
  Container
} from "@mui/material";
import { lightBlue } from "@mui/material/colors";

const Dashboard = () => {
  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{
        minHeight: "100vh",
        minWidth: "100vw",
        backgroundColor: lightBlue[50], // lightcyan equivalent
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Typography 
        variant="h1" 
        sx={{ 
          mb: 4, // margin-bottom: 32px
          fontSize: { xs: "2.5rem", md: "3.5rem" } // Responsive font
        }}
      >
        DASHBOARD
      </Typography>

      <Button
        component={Link}
        to="/signin"
        variant="contained"
        size="large"
        sx={{
          px: 4, // horizontal padding
          py: 1.5, // vertical padding
          fontSize: "1.1rem",
          textTransform: "none" // prevents uppercase transformation
        }}
      >
        SIGN IN
      </Button>
    </Container>
  );
};

export default Dashboard;