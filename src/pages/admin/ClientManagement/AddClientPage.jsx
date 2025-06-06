import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import withAuth from '../../../components/withAuth';

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
    Autocomplete
} from "@mui/material"

function AdminPage(){
    return <div>Admin-Only Content</div>;
}

const AddClient = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    // State for form fields
    const [clientName, setClientName] = useState('');
    const [clientGroup, setClientGroup] = useState('');
    
    // State for group options
    const [groupOptions, setGroupOptions] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    
    // State for form handling
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    
    // Fetch existing groups on component mount
    useEffect(() => {
        fetchGroups();
    }, []);
    
    const fetchGroups = async () => {
        try {
            setLoadingGroups(true);
            const { data: clients, error } = await supabase
                .from('Clients List')
                .select('Group')
                .not('Group', 'is', null)
                .not('Group', 'eq', '');
            
            if (error) {
                console.error('Error fetching groups:', error);
                return;
            }
            
            // Extract unique group names and filter out empty strings
            const uniqueGroups = [...new Set(
                clients
                    .map(client => client.Group?.trim())
                    .filter(group => group && group.length > 0)
            )].sort();
            
            setGroupOptions(uniqueGroups);
        } catch (err) {
            console.error('Error in fetchGroups:', err);
        } finally {
            setLoadingGroups(false);
        }
    };
    
    // Handle back button
    const handleBack = () => {
        navigate('/admin/ClientManagement');
    };
    
    // Reset the form 
    const resetForm = () => {
        setClientName('');
        setClientGroup('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        setDebugInfo('');
        
        try {
            // Validate inputs
            const trimmedName = clientName.trim();
            if (!trimmedName) {
                throw new Error('Client name cannot be empty');
            }

            // Check for duplicates in Supabase (case insensitive)
            const { data: existingClients, error: queryError } = await supabase
                .from('Clients List')
                .select('Client_Name')
                .ilike('Client_Name', trimmedName);

            if (queryError) {
                console.error('Supabase query error:', queryError);
                throw new Error(`Failed to check existing clients: ${queryError.message}`);
            }
            
            if (existingClients && existingClients.length > 0) {
                throw new Error('Client already exists in the list');
            }
            
            // Find the highest ID currently in the table
            const { data: clientsWithMaxId, error: maxIdError } = await supabase
                .from('Clients List')
                .select('id')
                .order('id', { ascending: false })
                .limit(1);
                
            if (maxIdError) {
                console.error('Error fetching max ID:', maxIdError);
                throw new Error(`Failed to generate new ID: ${maxIdError.message}`);
            }
            
            // Calculate the next ID (max + 1) or start with 1 if table is empty
            const nextId = clientsWithMaxId && clientsWithMaxId.length > 0 
                ? parseInt(clientsWithMaxId[0].id) + 1 
                : 1;
                
            setDebugInfo(`Found highest ID: ${clientsWithMaxId && clientsWithMaxId.length > 0 ? clientsWithMaxId[0].id : 'none'}\nCreating new client with ID: ${nextId}`);
            console.log(`Creating new client with ID: ${nextId}`);
            
            // Add to Supabase with the explicitly set next ID
            const { data: insertedClient, error: insertError } = await supabase
                .from('Clients List')
                .insert([{ 
                    id: nextId,
                    Client_Name: trimmedName,
                    Group: clientGroup.trim()
                }])
                .select();

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                throw new Error(`Failed to add client: ${insertError.message || 'Database error'}`);
            }
            
            console.log('Successfully inserted client:', insertedClient);

            // If a new group was added, refresh the group options for future use
            const trimmedGroup = clientGroup.trim();
            if (trimmedGroup && !groupOptions.includes(trimmedGroup)) {
                setGroupOptions(prev => [...prev, trimmedGroup].sort());
            }

            // Success state
            setSuccess(true);
            resetForm();
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admin/ClientManagement'), 1500);
        } catch (err) {
            console.error('Error adding client:', err);
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
                            to="/admin/ClientManagement"
                            variant='contained'
                            color='primary'
                            sx={{ visibility: isMobile ? 'hidden' : 'visible' }}
                        >
                            BACK
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
                        ADD NEW CLIENT
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
                        Client added successfully! Redirecting...
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
                    {/* Client Name Field */}
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
                            Client Name*
                        </Typography>
                        <TextField
                            id="clientName"
                            placeholder="Enter client name"
                            variant="outlined"
                            fullWidth
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
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

                    {/* Client Group Field - Now with Autocomplete */}
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
                            Group
                        </Typography>
                        <Autocomplete
                            id="clientGroup"
                            freeSolo
                            options={groupOptions}
                            value={clientGroup}
                            onChange={(event, newValue) => {
                                setClientGroup(newValue || '');
                            }}
                            onInputChange={(event, newInputValue) => {
                                setClientGroup(newInputValue);
                            }}
                            disabled={isSubmitting}
                            loading={loadingGroups}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select or enter group name"
                                    variant="outlined"
                                    fullWidth
                                    size={isMobile ? "small" : "medium"}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingGroups ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
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
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                    {option}
                                </Box>
                            )}
                            sx={{
                                '& .MuiAutocomplete-option': {
                                    fontSize: { xs: '0.95rem', md: '1rem' }
                                }
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
                                    Adding Client...
                                </>
                            ) : (
                                'Add Client'
                            )}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default withAuth(AddClient);