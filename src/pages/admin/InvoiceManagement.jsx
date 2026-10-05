import React from "react";
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

const InvoiceManagement = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                    maxWidth: 800,
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
                        fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                        textAlign: 'center',
                        fontWeight: 600
                    }}
                >
                    INVOICE MANAGEMENT
                </Typography>

                <Stack
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ width: '100%', alignItems: 'center' }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 2, sm: 2 }}
                        sx={{ width: '100%', justifyContent: 'center' }}
                    >
                        <Button
                            component={Link}
                            to="/admin/InvoiceManagement/CreateInvoice"
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
                            CREATE INVOICE
                        </Button>

                        <Button
                            component={Link}
                            to="/admin/InvoiceManagement/EditInvoice"
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
                            EDIT INVOICE
                        </Button>

                        <Button
                            component={Link}
                            to="/admin/InvoiceManagement/InvoiceReport"
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
                            INVOICE REPORT
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

export default InvoiceManagement;