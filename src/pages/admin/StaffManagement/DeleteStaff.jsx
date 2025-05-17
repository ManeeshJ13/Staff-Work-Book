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
    Button,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material"

function AdminPage(){
    return <div>Admin-Only Content</div>;
}

const DeleteStaff = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedStaffName, setSelectedStaffName] = useState('');
    
    // Fetch staff list on component mount
    useEffect(() => {
        fetchStaffList();
    }, []);
    
    // Function to fetch staff list from Supabase
    const fetchStaffList = async () => {
        try {
            setIsLoading(true);
            
            const { data, error } = await supabase
                .from('Staff List')
                .select('id, Staff_Name, hourly_rate')
                .order('Staff_Name', { ascending: true });
                
            if (error) {
                throw new Error(`Failed to fetch staff list: ${error.message}`);
            }
            
            setStaffList(data || []);
            setDebugInfo(`Fetched ${data ? data.length : 0} staff members`);
        } catch (err) {
            console.error('Error fetching staff:', err);
            setError(err.message);
            setShowDebug(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle back button
    const handleBack = () => {
        navigate('/admin/StaffManagement');
    };
    
    // Handle staff selection
    const handleStaffChange = (e) => {
        const staffId = e.target.value;
        setSelectedStaffId(staffId);
        
        // Find the staff name for confirmation dialog
        const selectedStaff = staffList.find(staff => staff.id === staffId);
        setSelectedStaffName(selectedStaff ? selectedStaff.Staff_Name : '');
        
        setError('');
        setSuccess(false);
    };
    
    // Open confirmation dialog
    const handleOpenConfirmDialog = () => {
        if (!selectedStaffId) {
            setError('Please select a staff member to delete');
            return;
        }
        setConfirmDialogOpen(true);
    };
    
    // Close confirmation dialog
    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };
    
    // Handle delete submission
    const handleDelete = async () => {
        setConfirmDialogOpen(false);
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        
        try {
            if (!selectedStaffId) {
                throw new Error('No staff selected for deletion');
            }
            
            // Delete from Supabase
            const { error: deleteError } = await supabase
                .from('Staff List')
                .delete()
                .eq('id', selectedStaffId);
                
            if (deleteError) {
                console.error('Supabase delete error:', deleteError);
                throw new Error(`Failed to delete staff: ${deleteError.message || 'Database error'}`);
            }
            
            setDebugInfo(`Successfully deleted staff with ID: ${selectedStaffId}`);
            console.log(`Successfully deleted staff ID: ${selectedStaffId}`);
            
            // Success state
            setSuccess(true);
            setSelectedStaffId('');
            
            // Refresh the staff list
            fetchStaffList();
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admin/StaffManagement'), 1500);
        } catch (err) {
            console.error('Error deleting staff:', err);
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
                            to="/admin/StaffManagement"
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
                        DELETE STAFF
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
                        Staff deleted successfully! Redirecting...
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

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {staffList.length === 0 ? (
                            <Alert 
                                severity="info" 
                                sx={{ 
                                    mb: { xs: 1.5, md: 2 },
                                    fontSize: { xs: '0.875rem', md: '1rem' }
                                }}
                            >
                                No staff members available.
                            </Alert>
                        ) : (
                            <Box sx={{ width: '100%', mb: { xs: 2, md: 3 } }}>
                                <Typography
                                    variant="subtitle1"
                                    component="p"
                                    sx={{
                                        fontWeight: 500,
                                        mb: 1,
                                        fontSize: { xs: '0.95rem', md: '1rem' }
                                    }}
                                >
                                    Select Staff to Delete
                                </Typography>
                                <FormControl 
                                    fullWidth
                                    disabled={isSubmitting}
                                    size={isMobile ? "small" : "medium"}
                                >
                                    <InputLabel id="staff-select-label">Staff Member</InputLabel>
                                    <Select
                                        labelId="staff-select-label"
                                        id="staff-select"
                                        value={selectedStaffId}
                                        label="Staff Member"
                                        onChange={handleStaffChange}
                                        sx={{
                                            fontSize: { xs: '0.95rem', md: '1rem' },
                                            borderRadius: { xs: 1, md: 1.5 }
                                        }}
                                    >
                                        {staffList.map((staff) => (
                                            <MenuItem key={staff.id} value={staff.id}>
                                                {staff.Staff_Name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

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
                                variant="contained"
                                color="error"
                                fullWidth
                                disabled={isSubmitting || staffList.length === 0 || !selectedStaffId}
                                onClick={handleOpenConfirmDialog}
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
                                {isSubmitting ? 'Deleting Staff...' : 'Delete Staff'}
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Staff Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete {selectedStaffName}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default withAuth(DeleteStaff);