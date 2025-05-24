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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from "@mui/material"

const DeleteClient = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    // State for client selection
    const [selectedClientId, setSelectedClientId] = useState('');
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for form handling
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Confirmation dialog state
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    
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
    
    // Handle back button
    const handleBack = () => {
        navigate('/admindash');
    };
    
    // Open confirmation dialog
    const handleOpenConfirmDialog = (e) => {
        e.preventDefault();
        if (!selectedClientId) {
            setError('Please select a client to delete');
            return;
        }
        setOpenConfirmDialog(true);
    };
    
    // Close confirmation dialog
    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };
    
    // Handle actual deletion
    const handleDelete = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        
        try {
            // Perform deletion from Supabase
            const { error: deleteError } = await supabase
                .from('Clients List')
                .delete()
                .eq('id', selectedClientId);
                
            if (deleteError) {
                throw new Error(`Failed to delete client: ${deleteError.message}`);
            }
            
            // Success state
            setSuccess(true);
            setSelectedClientId('');
            
            // Update clients list
            const updatedList = clientsList.filter(client => client.id !== selectedClientId);
            setClientsList(updatedList);
            
            // Close dialog
            setOpenConfirmDialog(false);
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admindash'), 1500);
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(err.message);
            setOpenConfirmDialog(false);
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
                            flexGrow: isMobile ? 1 : 0,
                            color: theme.palette.error.dark
                        }}
                    >
                        DELETE CLIENT
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
                        Client deleted successfully! Redirecting...
                    </Alert>
                )}
                
                <form onSubmit={handleOpenConfirmDialog} style={{ width: '100%' }}>
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
                            Select Client to Delete*
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
                                onChange={(e) => setSelectedClientId(e.target.value)}
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
                            color="error"
                            fullWidth
                            disabled={loading || isSubmitting || !selectedClientId}
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
                                    Deleting Client...
                                </>
                            ) : (
                                'Delete Client'
                            )}
                        </Button>
                    </Box>
                </form>
            </Paper>
            
            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Client Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this client?
                        <br />
                        {selectedClientId && (
                            <strong>
                                {clientsList.find(c => c.id === selectedClientId)?.Client_Name}
                            </strong>
                        )}
                        <br /><br />
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseConfirmDialog} 
                        color="inherit"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        variant="contained"
                        autoFocus
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default withAuth(DeleteClient);