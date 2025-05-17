import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import withAuth from '../../components/withAuth';

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
    CircularProgress
} from "@mui/material"

function AdminPage(){
    return <div>Admin-Only Content</div>;
}
const AddAssignment = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    // State for form fields
    const [assignmentName, setAssignmentName] = useState('');
    
    // State for form handling
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
        setAssignmentName('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        setDebugInfo('');
        
        try {
            // Validate inputs
            const trimmedName = assignmentName.trim();
            if (!trimmedName) {
                throw new Error('Assignment name cannot be empty');
            }

            // Check for duplicates in Supabase (case insensitive)
            const { data: existingAssignment, error: queryError } = await supabase
                .from('Assignments List')
                .select('Assignment_Name')
                .ilike('Assignment_Name', trimmedName);

            if (queryError) {
                console.error('Supabase query error:', queryError);
                throw new Error(`Failed to check existing assignments: ${queryError.message}`);
            }
            
            if (existingAssignment && existingAssignment.length > 0) {
                throw new Error('Assignment already exists in the list');
            }
            
            // Find the highest ID currently in the table
            const { data: assignmentsWithMaxId, error: maxIdError } = await supabase
                .from('Assignments List')
                .select('id')
                .order('id', { ascending: false })
                .limit(1);
                
            if (maxIdError) {
                console.error('Error fetching max ID:', maxIdError);
                throw new Error(`Failed to generate new ID: ${maxIdError.message}`);
            }
            
            // Calculate the next ID (max + 1) or start with 1 if table is empty
            const nextId = assignmentsWithMaxId && assignmentsWithMaxId.length > 0 
                ? parseInt(assignmentsWithMaxId[0].id) + 1 
                : 1;
                
            setDebugInfo(`Found highest ID: ${assignmentsWithMaxId && assignmentsWithMaxId.length > 0 ? assignmentsWithMaxId[0].id : 'none'}\nCreating new assignment with ID: ${nextId}`);
            console.log(`Creating new assignment with ID: ${nextId}`);
            
            // Add to Supabase with the explicitly set next ID
            const { data: insertedAssignment, error: insertError } = await supabase
                .from('Assignments List')
                .insert([{ 
                    id: nextId,
                    Assignment_Name: trimmedName,
                }])
                .select();

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                throw new Error(`Failed to add assignment: ${insertError.message || 'Database error'}`);
            }
            
            console.log('Successfully inserted assignment:', insertedAssignment);

            // Success state
            setSuccess(true);
            resetForm();
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admindash'), 1500);
        } catch (err) {
            console.error('Error adding assignment:', err);
            setError(err.message);
            setShowDebug(true);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    maxWidth: { xs: '100%', sm: 500, md: 650 },
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
                        ADD NEW ASSIGNMENT
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
                        Assignment added successfully! Redirecting...
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
                    {/* Assignment Name Field */}
                    <Box sx={{ mb: { xs: 2, md: 3 } }}>
                        <Typography
                            variant="subtitle1"
                            component="p"
                            sx={{
                                fontWeight: 500,
                                mb: 1,
                                fontSize: { xs: '0.95rem', md: '1rem' }
                            }}
                        >
                            Assignment Name*
                        </Typography>
                        <TextField
                            id="assignmentName"
                            placeholder="Enter Assignment name"
                            variant="outlined"
                            fullWidth
                            value={assignmentName}
                            onChange={(e) => setAssignmentName(e.target.value)}
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
                            {isSubmitting ? (
                                <>
                                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                    Adding Assignment...
                                </>
                            ) : (
                                'Add Assignment'
                            )}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default withAuth(AddAssignment);