import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    useMediaQuery,
    useTheme,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
    Snackbar
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Mock data - replace with actual API calls in production
const mockAssignments = [
    { id: 1, title: "Research Paper", course: "English 101", dueDate: "2025-06-15" },
    { id: 2, title: "Math Quiz", course: "Mathematics", dueDate: "2025-05-25" },
    { id: 3, title: "Lab Report", course: "Chemistry", dueDate: "2025-06-01" },
    { id: 4, title: "Group Project", course: "Business", dueDate: "2025-06-30" }
];

const DeleteAssignment = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // Fetch assignments - replace with actual API call
    useEffect(() => {
        // Simulate API call delay
        const fetchAssignments = async () => {
            try {
                // Replace with actual API call:
                // const response = await fetch('/api/assignments');
                // const data = await response.json();
                
                // Using mock data for now
                setTimeout(() => {
                    setAssignments(mockAssignments);
                    setLoading(false);
                }, 800);
            } catch (err) {
                setError("Failed to load assignments");
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const handleDeleteClick = (assignment) => {
        setSelectedAssignment(assignment);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAssignment) return;
        
        setLoading(true);
        
        try {
            // Replace with actual delete API call:
            // await fetch(`/api/assignments/${selectedAssignment.id}`, {
            //     method: 'DELETE',
            // });
            
            // Simulating successful delete
            setTimeout(() => {
                setAssignments(assignments.filter(a => a.id !== selectedAssignment.id));
                setSnackbar({
                    open: true,
                    message: "Assignment deleted successfully",
                    severity: "success"
                });
                setLoading(false);
                setOpenDialog(false);
            }, 500);
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to delete assignment",
                severity: "error"
            });
            setLoading(false);
            setOpenDialog(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container 
            maxWidth="md"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                px: { xs: 2, sm: 3 },
                py: { xs: 3, sm: 4 },
                overflow: 'hidden'
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
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
                        mb: { xs: 2, sm: 3 },
                        fontSize: { 
                            xs: "1.75rem", 
                            sm: "2.25rem", 
                            md: "2.5rem" 
                        },
                        textAlign: 'center',
                        fontWeight: 600
                    }}
                >
                    DELETE ASSIGNMENT
                </Typography>
                
                {loading && !openDialog ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                ) : assignments.length === 0 ? (
                    <Typography variant="body1" sx={{ my: 4, textAlign: 'center' }}>
                        No assignments found.
                    </Typography>
                ) : (
                    <List sx={{ width: '100%', mb: 3 }}>
                        {assignments.map((assignment) => (
                            <ListItem 
                                key={assignment.id}
                                divider
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={assignment.title}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {assignment.course}
                                            </Typography>
                                            {" — Due: " + new Date(assignment.dueDate).toLocaleDateString()}
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton 
                                        edge="end" 
                                        aria-label="delete"
                                        onClick={() => handleDeleteClick(assignment)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}

                <Button
                    onClick={() => navigate("/admin/AssignmentManagement")}
                    variant="contained"
                    sx={{
                        px: { xs: 3, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textTransform: 'none',
                        mt: { xs: 2, sm: 3 }
                    }}
                >
                    BACK
                </Button>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the assignment "{selectedAssignment?.title}"? 
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        color="error" 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DeleteAssignment;