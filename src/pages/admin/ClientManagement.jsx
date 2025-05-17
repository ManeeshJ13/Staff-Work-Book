import React from "react";
import { useNavigate } from "react-router-dom"; 
import { Link } from "react-router-dom";    
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    useMediaQuery,
    useTheme,
    Stack
} from "@mui/material";

const ClientManagement = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    return (
        <Container 
            maxWidth="xs"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                px: { xs: 2, sm: 3 },
                overflow: 'hidden'
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: 500,
                    padding: { xs: 2, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    boxShadow: isMobile 
                        ? '0 4px 6px rgba(0,0,0,0.1)' 
                        : '0 10px 15px rgba(0,0,0,0.1)'
                }}
            >
                <Typography
                    variant="h1"
                    sx={{
                        mb: { xs: 3, sm: 4 },
                        fontSize: { 
                            xs: "2rem", 
                            sm: "2.5rem", 
                            md: "3rem" 
                        },
                        textAlign: 'center',
                        fontWeight: 600
                    }}
                >
                    CLIENT MANAGEMENT
                </Typography>
                
                <Stack 
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ 
                        width: '100%',
                        alignItems: 'center'
                    }}
                >
                    <Stack 
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 2, sm: 2 }}
                        sx={{ 
                            width: '100%', 
                            justifyContent: 'center' 
                        }}
                    >
                        <Button
                            component={Link}
                            to="/admin/ClientManagement/AddClientPage"
                            variant="contained"
                            fullWidth={isMobile}
                            sx={{
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1, sm: 1.5 },
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                textTransform: 'none',
                                maxWidth: { sm: 200 }
                            }}
                        >
                            ADD CLIENT
                        </Button>

                        <Button
                            component={Link}
                            to="/admin/ClientManagement/DeleteClient"
                            variant="contained"
                            fullWidth={isMobile}
                            sx={{
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1, sm: 1.5 },
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                textTransform: 'none',
                                maxWidth: { sm: 200 }
                            }}
                        >
                            DELETE CLIENT
                        </Button>

                        <Button
                            component={Link}
                            to="/admin/ClientManagement/EditClient"
                            variant="contained"
                            fullWidth={isMobile}
                            sx={{
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1, sm: 1.5 },
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                textTransform: 'none',
                                maxWidth: { sm: 200 }
                            }}
                        >
                            EDIT CLIENT
                        </Button>
                    </Stack>

                    <Button
                        component={Link}
                        to="/admindash"
                        variant="contained"
                        fullWidth={isMobile}
                        sx={{
                            px: { xs: 2, sm: 4 },
                            py: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            textTransform: 'none',
                            maxWidth: { sm: 200 },
                            mt: { xs: 2, sm: 3 }
                        }}
                    >
                        BACK
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
};

export default ClientManagement;