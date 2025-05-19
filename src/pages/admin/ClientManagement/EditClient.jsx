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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Divider
} from "@mui/material"

const EditClient = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    // State for client selection
    const [selectedClientId, setSelectedClientId] = useState('');
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientLoading, setClientLoading] = useState(false);
    
    // State for client details
    const [clientData, setClientData] = useState({
        Client_Name: '',
        Group: ''
    });
    
    // State for form handling
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Fetch clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data, error } = await supabase
                    .from('Clients List')
                    .select('id, Client_Name')
                    .order('Client_Name');
                
                if (error) throw error;
                
                setClientsList(data || []);
            } catch (err) {
                console.error('Error fetching clients:', err);
                setError('Failed to load clients. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchClients();
    }, []);
    
    // Handle client selection change
    const handleClientChange = async (e) => {
        const clientId = e.target.value;
        setSelectedClientId(clientId);
        
        if (clientId) {
            setClientLoading(true);
            setError('');
            
            try {
                const { data, error } = await supabase
                    .from('Clients List')
                    .select('*')
                    .eq('id', clientId)
                    .single();
                
                if (error) throw error;
                
                if (data) {
                    setClientData({
                        Client_Name: data.Client_Name || '',
                        Group: data.Group || ''
                    });
                }
            } catch (err) {
                console.error('Error fetching client details:', err);
                setError('Failed to load client details. Please try again.');
            } finally {
                setClientLoading(false);
            }
        } else {
            // Clear form if no client is selected
            setClientData({
                Client_Name: '',
                Group: ''
            });
        }
    };
    
    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        
        try {
            // Validate form
            if (!clientData.Client_Name.trim()) {
                throw new Error('Client name is required');
            }
            
            // Update client in Supabase
            const { error: updateError } = await supabase
                .from('Clients List')
                .update({
                    Client_Name: clientData.Client_Name,
                    Group: clientData.Group
                })
                .eq('id', selectedClientId);
                
            if (updateError) {
                throw new Error(`Failed to update client: ${updateError.message}`);
            }
            
            // Update local clients list with new name if it changed
            const updatedClientsList = clientsList.map(client => 
                client.id === selectedClientId 
                    ? { ...client, Client_Name: clientData.Client_Name } 
                    : client
            );
            setClientsList(updatedClientsList);
            
            // Show success message
            setSuccess(true);
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admindash'), 1500);
        } catch (err) {
            console.error('Error updating client:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back button
    const handleBack = () => {
        navigate('/admindash');
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
                            flexGrow: isMobile ? 1 : 0,
                            color: theme.palette.primary.main
                        }}
                    >
                        EDIT CLIENT
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
                        Client updated successfully! Redirecting...
                    </Alert>
                )}
                
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    {/* Client Selection */}
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
                            Select Client to Edit*
                        </Typography>
                        <FormControl 
                            fullWidth
                            disabled={loading || isSubmitting}
                            size={isMobile ? "small" : "medium"}
                        >
                            <InputLabel id="client-select-label">Client</InputLabel>
                            <Select
                                labelId="client-select-label"
                                id="client-select"
                                value={selectedClientId}
                                label="Client"
                                onChange={handleClientChange}
                                sx={{
                                    fontSize: { xs: '0.95rem', md: '1rem' },
                                    borderRadius: { xs: 1, md: 1.5 }
                                }}
                            >
                                {loading ? (
                                    <MenuItem value="" disabled>Loading clients...</MenuItem>
                                ) : clientsList.length === 0 ? (
                                    <MenuItem value="" disabled>No clients available</MenuItem>
                                ) : (
                                    clientsList.map((client) => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.Client_Name}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    </Box>

                    {selectedClientId && (
                        <>
                            <Divider sx={{ my: { xs: 2, md: 3 } }} />
                            
                            {clientLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : (
                                <Box>
                                    <TextField
                                        fullWidth
                                        label="Client Name"
                                        name="Client_Name"
                                        value={clientData.Client_Name}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        size={isMobile ? "small" : "medium"}
                                        sx={{
                                            fontSize: { xs: '0.95rem', md: '1rem' },
                                            borderRadius: { xs: 1, md: 1.5 },
                                            mb: 2
                                        }}
                                    />
                                    
                                    <TextField
                                        fullWidth
                                        label="Group"
                                        name="Group"
                                        value={clientData.Group}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        size={isMobile ? "small" : "medium"}
                                        sx={{
                                            fontSize: { xs: '0.95rem', md: '1rem' },
                                            borderRadius: { xs: 1, md: 1.5 }
                                        }}
                                    />
                                </Box>
                            )}
                        </>
                    )}

                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1.5, sm: 2 },
                            mt: { xs: 3, md: 4 }
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="inherit"
                            fullWidth
                            onClick={handleBack}
                            disabled={isSubmitting}
                            sx={{
                                py: { xs: 1, md: 1.5 },
                                order: { xs: 2, sm: 1 }
                            }}
                        >
                            Cancel
                        </Button>
                        
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading || clientLoading || isSubmitting || !selectedClientId}
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
                                    Saving Changes...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default withAuth(EditClient);