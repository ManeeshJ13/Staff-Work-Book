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
} from "@mui/material";

const ASSIGNMENT_TABLE = 'Assignments List'; // Defined as constant

const EditClient = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    
    const [assignmentData, setAssignmentData] = useState({
        Assignment_Name: '',
    });
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Fetch assignments
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const { data, error } = await supabase
                    .from(ASSIGNMENT_TABLE)
                    .select('id, Assignment_Name')
                    .order('Assignment_Name');
                
                if (error) throw error;
                setAssignmentsList(data || []);
            } catch (err) {
                setError('Failed to load assignments');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);
    
    // Handle assignment selection
    const handleAssignmentChange = async (e) => {
        const assignmentId = e.target.value;
        setSelectedAssignmentId(assignmentId);
        setError('');
        
        if (!assignmentId) {
            setAssignmentData({ Assignment_Name: '' });
            return;
        }

        setAssignmentLoading(true);
        try {
            const { data, error } = await supabase
                .from(ASSIGNMENT_TABLE)
                .select('*')
                .eq('id', assignmentId)
                .single();
            
            if (error) throw error;
            setAssignmentData({
                Assignment_Name: data?.Assignment_Name || '',
            });
        } catch (err) {
            setError('Failed to load assignment details');
            console.error('Details error:', err);
        } finally {
            setAssignmentLoading(false);
        }
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            // Validate
            if (!assignmentData.Assignment_Name.trim()) {
                throw new Error('Assignment name is required');
            }

            // Debug log
            console.log('Updating:', {
                id: selectedAssignmentId,
                name: assignmentData.Assignment_Name
            });

            // Update in Supabase
            const { error: updateError } = await supabase
                .from(ASSIGNMENT_TABLE)
                .update({ Assignment_Name: assignmentData.Assignment_Name })
                .eq('id', selectedAssignmentId);
            
            if (updateError) {
                console.error('Supabase error:', updateError);
                throw new Error(updateError.message || 'Update failed (no details)');
            }

            // Update local state
            setAssignmentsList(prev => prev.map(item => 
                item.id === selectedAssignmentId 
                    ? { ...item, Assignment_Name: assignmentData.Assignment_Name } 
                    : item
            ));
            
            setSuccess(true);
            setTimeout(() => navigate('/admin/AssignmentManagement'), 1500);
        } catch (err) {
            setError(err.message || 'Failed to update assignment');
            console.error('Submission error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        EDIT ASSIGNMENT
                    </Typography>
                    <Button 
                        component={Link}
                        to="/admin/AssignmentManagement"
                        variant="contained"
                        sx={{
                            ml:'20px'
                        }}
                    >
                        Back
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>Updated successfully!</Alert>}

                <form onSubmit={handleSubmit}>
                    {/* Assignment Selection */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Select Assignment</InputLabel>
                        <Select
                            value={selectedAssignmentId}
                            onChange={handleAssignmentChange}
                            label="Select Assignment"
                            disabled={loading}
                        >
                            {loading ? (
                                <MenuItem disabled>Loading...</MenuItem>
                            ) : assignmentsList.map((assignment) => (
                                <MenuItem key={assignment.id} value={assignment.id}>
                                    {assignment.Assignment_Name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Assignment Details */}
                    {selectedAssignmentId && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Assignment Name"
                                        name="Assignment_Name"
                                        value={assignmentData.Assignment_Name}
                                        onChange={(e) => setAssignmentData({
                                            ...assignmentData,
                                            Assignment_Name: e.target.value
                                        })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </Grid>
                            </Grid>
                            
                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!selectedAssignmentId || isSubmitting}
                                    fullWidth
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} />
                                    ) : 'Save Changes'}
                                </Button>
                            </Box>
                        </>
                    )}
                </form>
            </Paper>
        </Container>
    );
};

export default withAuth(EditClient);