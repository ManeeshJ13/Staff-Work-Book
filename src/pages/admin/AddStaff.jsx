import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

import {
    Box,
    Typography,
    Paper,
    Container,
    useTheme,
    useMediaQuery,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Snackbar
} from "@mui/material"

const AddStaff = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    const [newStaffName, setNewStaffName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    
    // Handle back button
    const handleBack = () => {
        navigate('/admindash');
    };
    
    // Reset the form 
    const resetForm = () => {
        setNewStaffName('');
        setHourlyRate('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
      try {
    // Validate inputs
    const trimmedName = newStaffName.trim();
    if (!trimmedName) {
        throw new Error('Staff name cannot be empty');
    }

    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate <= 0) {
        throw new Error('Please enter a valid hourly rate (greater than 0)');
    }

    // Check for duplicates in Supabase (case insensitive)
    const { data: existingStaff, error: queryError } = await supabase
        .from('Staff List')
        .select('Staff_Name')
        .ilike('Staff_Name', trimmedName);

    if (queryError) {
        console.error('Supabase query error:', queryError);
        throw new Error(`Failed to check existing staff: ${queryError.message}`);
    }
    
    if (existingStaff && existingStaff.length > 0) {
        throw new Error('Staff already exists in the list');
    }
    
    // Find the highest ID currently in the table
    const { data: staffWithMaxId, error: maxIdError } = await supabase
        .from('Staff List')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
        
    if (maxIdError) {
        console.error('Error fetching max ID:', maxIdError);
        throw new Error(`Failed to generate new ID: ${maxIdError.message}`);
    }
    
    // Calculate the next ID (max + 1) or start with 1 if table is empty
    const nextId = staffWithMaxId && staffWithMaxId.length > 0 
        ? parseInt(staffWithMaxId[0].id) + 1 
        : 1;
        
    setDebugInfo(`Found highest ID: ${staffWithMaxId && staffWithMaxId.length > 0 ? staffWithMaxId[0].id : 'none'}\nCreating new staff with ID: ${nextId}`);
    console.log(`Creating new staff with ID: ${nextId}`);
    
    // Add to Supabase with the explicitly set next ID
    const { data: insertedStaff, error: insertError } = await supabase
        .from('Staff List')
        .insert([{ 
            id: nextId,
            Staff_Name: trimmedName,
            hourly_rate: rate
        }])
        .select();

    if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Failed to add staff: ${insertError.message || 'Database error'}`);
    }
    
    console.log('Successfully inserted staff:', insertedStaff);

    // Success state
    setSuccess(true);
    resetForm();
    
    // Redirect after 1.5 seconds
    setTimeout(() => navigate('/admindash'), 1500);
} catch (err) {
    console.error('Error adding staff:', err);
    setError(err.message);
    setShowDebug(true);
} finally {
    setIsSubmitting(false);
}  setDebugInfo('');
    }

        
    

    return (
        <Container
            maxWidth="md"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: { xs: 'calc(100vh - 32px)', md: '100vh' },
                py: { xs: 2, md: 4 },
                px: { xs: 2, sm: 3, md: 4 },
                overflow: 'hidden'
            }}
        >
            <Paper
                elevation={isMobile ? 2 : 4}
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 500, md: 600 },
                    padding: { xs: 2.5, sm: 3, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: { xs: 1.5, md: 2 },
                    boxShadow: { 
                        xs: '0 4px 8px rgba(0,0,0,0.05)',
                        md: '0 10px 15px rgba(0,0,0,0.1)'
                    },
                    gap: { xs: 1.5, md: 2 },
                    transition: 'all 0.3s ease'
                }}
            >
                <Box 
                    sx={{
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: isMobile ? 'center' : 'space-between',
                        mb: { xs: 1, md: 2 }
                    }}
                >
                    {!isMobile && (
                        <Button 
                            component={Link}
                            to="/admindash"
                            variant='contained'
                            color='primary'
                            sx={{ visibility: isMobile ? 'hidden' : 'visible' }}
                        >
                            Home
                        </Button>
                    )}
                    
                    <Typography
                        variant={isMobile ? "h6" : "h5"}
                        component="h1"
                        sx={{
                            fontWeight: 600,
                            textAlign: isMobile ? 'center' : 'left',
                            flexGrow: isMobile ? 1 : 0
                        }}
                    >
                        ADD NEW STAFF
                    </Typography>
                    
                    {!isMobile && <Box sx={{ width: 64 }} />}
                </Box>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: { xs: 1.5, md: 2 },
                            fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                    >
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mb: { xs: 1.5, md: 2 },
                            fontSize: { xs: '0.875rem', md: '1rem' }
                        }}
                    >
                        Staff added successfully! Redirecting...
                    </Alert>
                )}
                
                {showDebug && debugInfo && (
                    <Alert 
                        severity="info" 
                        sx={{ 
                            mb: { xs: 1.5, md: 2 },
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            '& .MuiAlert-message': {
                                whiteSpace: 'pre-wrap'
                            }
                        }}
                    >
                        {debugInfo}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Box 
                        sx={{ 
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: { xs: 2, md: 3 },
                            mb: { xs: 2, md: 3 }
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography
                                variant="subtitle1"
                                component="p"
                                sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                    fontSize: { xs: '0.95rem', md: '1rem' }
                                }}
                            >
                                Staff Name
                            </Typography>
                            <TextField
                                id="staffName"
                                placeholder="Enter full name"
                                variant="outlined"
                                fullWidth
                                value={newStaffName}
                                onChange={(e) => setNewStaffName(e.target.value)}
                                required
                                disabled={isSubmitting}
                                size={isMobile ? "small" : "medium"}
                                InputProps={{
                                    sx: {
                                        fontSize: { xs: '0.95rem', md: '1rem' },
                                        borderRadius: { xs: 1, md: 1.5 }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: theme.palette.primary.main,
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ width: '100%' }}>
                            <Typography
                                variant="subtitle1"
                                component="p"
                                sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                    fontSize: { xs: '0.95rem', md: '1rem' }
                                }}
                            >
                                Hourly Rate
                            </Typography>
                            <TextField
                                id="hourlyRate"
                                placeholder="Enter hourly rate"
                                variant="outlined"
                                fullWidth
                                type="number"
                                inputProps={{ 
                                    min: "0", 
                                    step: "0.01",
                                    inputMode: 'decimal'
                                }}
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                required
                                disabled={isSubmitting}
                                size={isMobile ? "small" : "medium"}
                                InputProps={{
                                    sx: {
                                        fontSize: { xs: '0.95rem', md: '1rem' },
                                        borderRadius: { xs: 1, md: 1.5 }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: theme.palette.primary.main,
                                        },
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1.5, sm: 2 },
                            mt: { xs: 1, md: 2 }
                        }}
                    >
                        {isMobile && (
                            <Button
                                variant="outlined"
                                color="inherit"
                                fullWidth
                                onClick={handleBack}
                                disabled={isSubmitting}
                                sx={{
                                    py: { xs: 1, md: 1.5 },
                                    order: 2
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                        
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                py: { xs: 1.2, md: 1.5 },
                                fontWeight: 600,
                                order: { xs: 1, sm: 2 },
                                boxShadow: 1,
                                '&:hover': {
                                    boxShadow: 2
                                }
                            }}
                        >
                            {isSubmitting ? 'Adding Staff...' : 'Add Staff'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default AddStaff