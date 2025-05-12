import React from "react";  
import { useNavigate } from "react-router-dom"; 
import { Link } from "react-router-dom";    
import {
    Box,
    Typography,
    Button,
    Container,
    Paper
} from "@mui/material";
import { lightBlue } from "@mui/material/colors";


const StaffDashboard = () => {
    return(
        <Paper
        elevation={3}
        sx={{
            padding:4,
            display:"flex",
            flexDirection:"column",
            alignItems:"center",
            width:"100%"
        }}>
            <Typography
            variant="h1"
            sx={{
                mb:4,
                fontSize:{xs:"2.5rem",md:"3.5rem"}
            }}>
                STAFF DASHBOARD
            </Typography>
            
            <Box
            sx={{
                display:"flex",
                gap:2,
                justifyContent:"center",
                margin:2,
            }}>
                <Button
                component={Link}
                to="/dataentry"
                variant="contained"
                size="large"
                sz={{
                    px:4,
                    py:1.5,
                    fontSize:"1.1rem",
                    textTransform:"none"
                }}>
                Enter Data
                </Button>

                <Button
                component={Link}
                to="/dataedit"
                variant="contained"
                size="large"
                sz={{
                    px:4,
                    py:1.5,
                    fontSize:"1.1rem",
                    textTransform:"none"
                }}>
                Edit Data
                </Button>
            </Box>
            <Box>
                <Button
                component={Link}
                to="/signin"
                variant="contained"
                size="large"
                sz={{
                    px:4,
                    py:1.5,
                    fontSize:"1.1rem",
                    textTransform:"none"
                }}>
                Logout
                </Button>
            </Box>

        </Paper>
    );
};

export default StaffDashboard;