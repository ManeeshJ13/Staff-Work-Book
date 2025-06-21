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
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Switch
} from "@mui/material";

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const EditStaff = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const navigate = useNavigate();
    
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [staffData, setStaffData] = useState({
        Staff_Name: '',
        hourly_rate: '',
        Password: '',
        Enabled: true
    });
    const [showPassword, setShowPassword] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingStaffData, setIsLoadingStaffData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [showDebug, setShowDebug] = useState(false);
    
    // Fetch staff list on component mount
    useEffect(() => {
        fetchStaffList();
    }, []);
    
    // Fetch selected staff data when staff selection changes
    useEffect(() => {
        if (selectedStaffId) {
            fetchStaffData(selectedStaffId);
        } else {
            setStaffData({
                Staff_Name: '',
                hourly_rate: '',
                Password: '',
                Enabled: true
            });
        }
    }, [selectedStaffId]);
    
    // Function to fetch staff list from Supabase
    const fetchStaffList = async () => {
        try {
            setIsLoading(true);
            
            const { data, error } = await supabase
                .from('Staff List')
                .select('id, Staff_Name, hourly_rate, Enabled')
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
    
    // Function to fetch selected staff data
    const fetchStaffData = async (staffId) => {
        try {
            setIsLoadingStaffData(true);
            
            const { data, error } = await supabase
                .from('Staff List')
                .select('Staff_Name, hourly_rate, Password, Enabled')
                .eq('id', staffId)
                .single();
                
            if (error) {
                throw new Error(`Failed to fetch staff details: ${error.message}`);
            }
            
            if (data) {
                setStaffData({
                    Staff_Name: data.Staff_Name || '',
                    hourly_rate: data.hourly_rate || '',
                    Password: data.Password || '',
                    Enabled: data.Enabled !== undefined ? data.Enabled : true
                });
                
                setDebugInfo(`Fetched details for staff ID: ${staffId}`);
            } else {
                throw new Error('Staff not found');
            }
        } catch (err) {
            console.error('Error fetching staff details:', err);
            setError(err.message);
            setShowDebug(true);
        } finally {
            setIsLoadingStaffData(false);
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
        setError('');
        setSuccess(false);
    };
    
    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // For hourly_rate, ensure it's a valid number
        if (name === 'hourly_rate') {
            // Allow empty string or numeric values
            if (value === '' || (!isNaN(parseFloat(value)) && isFinite(value))) {
                setStaffData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        } else {
            setStaffData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        setError('');
        setSuccess(false);
    };

    // Handle enabled toggle
    const handleEnabledChange = (e) => {
        setStaffData(prev => ({
            ...prev,
            Enabled: e.target.checked
        }));
        setError('');
        setSuccess(false);
    };
    
    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    
    // Open confirmation dialog
    const handleOpenConfirmDialog = () => {
        if (!selectedStaffId) {
            setError('Please select a staff member to update');
            return;
        }
        
        if (!staffData.Staff_Name.trim()) {
            setError('Staff Name cannot be empty');
            return;
        }
        
        setConfirmDialogOpen(true);
    };
    
    // Close confirmation dialog
    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };
    
    // Handle update submission
    const handleUpdate = async () => {
        setConfirmDialogOpen(false);
        setIsSubmitting(true);
        setError('');
        setSuccess(false);
        
        try {
            if (!selectedStaffId) {
                throw new Error('No staff selected for update');
            }
            
            // Validate inputs
            if (!staffData.Staff_Name.trim()) {
                throw new Error('Staff Name cannot be empty');
            }
            
            // Prepare update data
            const updateData = {
                Staff_Name: staffData.Staff_Name.trim(),
                hourly_rate: staffData.hourly_rate === '' ? null : parseFloat(staffData.hourly_rate),
                Enabled: staffData.Enabled
            };
            
            // Only update password if it's not empty
            if (staffData.Password.trim()) {
                updateData.Password = staffData.Password.trim();
            }
            
            // Update in Supabase
            const { error: updateError } = await supabase
                .from('Staff List')
                .update(updateData)
                .eq('id', selectedStaffId);
                
            if (updateError) {
                console.error('Supabase update error:', updateError);
                throw new Error(`Failed to update staff: ${updateError.message || 'Database error'}`);
            }
            
            setDebugInfo(`Successfully updated staff with ID: ${selectedStaffId}`);
            console.log(`Successfully updated staff ID: ${selectedStaffId}`);
            
            // Success state
            setSuccess(true);
            
            // Refresh the staff list
            fetchStaffList();
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admin/StaffManagement'), 1500);
        } catch (err) {
            console.error('Error updating staff:', err);
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
                        EDIT STAFF DETAILS
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
                        Staff details updated successfully! Redirecting...
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
                            <>
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
                                        Select Staff to Edit
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
                                                    {staff.Staff_Name} {staff.Enabled === false && ' (Disabled)'}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {selectedStaffId && (
                                    <Box sx={{ 
                                        width: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        gap: { xs: 2, md: 3 }
                                    }}>
                                        {isLoadingStaffData ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : (
                                            <>
                                                <TextField
                                                    label="Staff Name"
                                                    name="Staff_Name"
                                                    value={staffData.Staff_Name}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    disabled={isSubmitting}
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        fontSize: { xs: '0.95rem', md: '1rem' },
                                                    }}
                                                    required
                                                />
                                                
                                                <TextField
                                                    label="Hourly Rate"
                                                    name="hourly_rate"
                                                    value={staffData.hourly_rate}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    disabled={isSubmitting}
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        fontSize: { xs: '0.95rem', md: '1rem' },
                                                    }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"></InputAdornment>,
                                                    }}
                                                    type="number"
                                                />
                                                
                                                <TextField
                                                    label="Password (leave blank to keep unchanged)"
                                                    name="Password"
                                                    value={staffData.Password}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    disabled={isSubmitting}
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        fontSize: { xs: '0.95rem', md: '1rem' },
                                                    }}
                                                    type={showPassword ? 'text' : 'password'}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    aria-label="toggle password visibility"
                                                                    onClick={handleTogglePasswordVisibility}
                                                                    edge="end"
                                                                >
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />

                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    py: 1,
                                                    px: 1
                                                }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={staffData.Enabled}
                                                                onChange={handleEnabledChange}
                                                                disabled={isSubmitting}
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontSize: { xs: '0.95rem', md: '1rem' },
                                                                    fontWeight: 500,
                                                                    color: staffData.Enabled ? 'success.main' : 'error.main'
                                                                }}
                                                            >
                                                                {staffData.Enabled ? 'Enabled' : 'Disabled'}
                                                            </Typography>
                                                        }
                                                        sx={{ 
                                                            m: 0,
                                                            '& .MuiFormControlLabel-label': {
                                                                ml: 1
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                )}

                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: { xs: 1.5, sm: 2 },
                                        mt: { xs: 2, md: 3 }
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
                                        color="primary"
                                        fullWidth
                                        disabled={isSubmitting || staffList.length === 0 || !selectedStaffId || isLoadingStaffData}
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
                                        {isSubmitting ? 'Updating...' : 'Update Staff'}
                                    </Button>
                                </Box>
                            </>
                        )}
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
                    {"Confirm Staff Update"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to update the details for this staff member?
                        {!staffData.Enabled && (
                            <Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main', fontWeight: 'bold' }}>
                                Note: This staff member will be disabled and unable to access the system.
                            </Box>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} color="primary" autoFocus>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default withAuth(EditStaff);