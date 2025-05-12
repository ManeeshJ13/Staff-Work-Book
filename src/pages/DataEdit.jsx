import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Material-UI imports
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Autocomplete
} from '@mui/material';
import {
  Home as HomeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

const DataEdit = () => {
  const navigate = useNavigate();
  const staffName = localStorage.getItem('currentStaff');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workEntries, setWorkEntries] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lists that will be fetched from Supabase
  const [clientList, setClientList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);
  const [financialYears, setFinancialYears] = useState(['2023', '2024', '2025']);

  // Get the date for 7 days ago
  const getOneWeekAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Fetch client and assignment lists from Supabase
  useEffect(() => {
    const fetchLists = async () => {
      try {
        // Fetch clients
        const { data: clientData, error: clientError } = await supabase
          .from('Clients List') 
          .select('Client_Name'); 
        if (clientError) throw clientError;
        
        // Fetch assignments from Assignments List table
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('Assignments List')
          .select('Assignment_Name');
        if (assignmentError) throw assignmentError;

        // Process clients
        const sortedClients = clientData
          .map(item => item.Client_Name)
          .filter(Boolean) // Remove null/undefined
          .sort((a, b) => a.localeCompare(b));
        
        setClientList(sortedClients);

        // Process assignments
        const sortedAssignments = assignmentData
          .map(item => item.Assignment_Name)
          .filter(Boolean) // Remove null/undefined
          .sort((a, b) => a.localeCompare(b));
        
        setAssignmentList(sortedAssignments);

      } catch (error) {
        console.error("Error fetching lists:", error);
        setError(`Failed to load lists: ${error.message}`);
        // Fallback assignments if fetch fails
        setAssignmentList(['Audit', 'Tax Return', 'Consulting', 'Bookkeeping']);
      }
    };
    
    fetchLists();
  }, []);

  // Fetch work entries for the past week
  useEffect(() => {
    if (!staffName) {
      navigate('/signin');
      return;
    }

    const fetchWorkEntries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const oneWeekAgo = getOneWeekAgo();
        const oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        const { data, error } = await supabase
          .from('Staff Work')
          .select('*')
          .eq('Name', staffName)
          .gte('Date', oneWeekAgoFormatted)
          .order('Date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        console.log('Fetched work entries:', data);
        setWorkEntries(data || []);
      } catch (error) {
        console.error('Error fetching work entries:', error);
        setError(`Failed to load your work history: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkEntries();
  }, [staffName, navigate]);

  // Navigate to dashboard if not signed in
  useEffect(() => {
    if (!staffName) {
      navigate('/signin');
    }
  }, [staffName, navigate]);

  // Handle expanding/collapsing entry details
  const handleExpandClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Open edit dialog for an entry
  const handleEditClick = (entry) => {
    // Parse the date and times for the form
    let parsedEntry = {
      ...entry,
      date: entry.Date ? new Date(entry.Date) : new Date(),
      startTime: parseTimeString(entry.Start_Time),
      endTime: parseTimeString(entry.End_Time),
      client: entry.Client || '',
      assignment: entry.Assignment || '',
      workDescription: entry.Work_Done || '',
      remarks: entry.Remark || '',
      financialYear: entry.Financial_Year || 2024,
      hours: entry.Hours || 0,
      calculatedHours: calculateHours(parseTimeString(entry.Start_Time), parseTimeString(entry.End_Time)),
      completion: entry.Completion !== null ? entry.Completion : true,
      presence: entry.Presence !== null ? entry.Presence : true
    };
    
    setCurrentEntry(parsedEntry);
    setEditDialogOpen(true);
  };

  // Parse time string (HH:MM) to Date object
  const parseTimeString = (timeStr) => {
    if (!timeStr) return new Date(new Date().setHours(9, 0, 0, 0));
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  // Calculate hours between two times
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const diffMs = endTime - startTime;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return Number(diffHrs.toFixed(1));
  };

  // Handle time changes in the form
  const handleTimeChange = (field, value) => {
    const updatedEntry = {
      ...currentEntry,
      [field]: value
    };
    
    if (field === 'startTime' || field === 'endTime') {
      if (updatedEntry.startTime && updatedEntry.endTime) {
        const calculatedHrs = calculateHours(updatedEntry.startTime, updatedEntry.endTime);
        updatedEntry.calculatedHours = calculatedHrs;
        // Auto-fill the hours field with calculated hours if user hasn't manually edited
        if (field === 'endTime' && !currentEntry.hasUserEditedHours) {
          updatedEntry.hours = calculatedHrs;
        }
      }
    }
    
    setCurrentEntry(updatedEntry);
  };

  // Handle hours change
  const handleHoursChange = (e) => {
    setCurrentEntry({
      ...currentEntry,
      hours: Number(e.target.value),
      hasUserEditedHours: true // Flag to track if user has manually edited hours
    });
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    
    // Try to parse the time string into hours and minutes
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a new date and set the hours and minutes
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    
    // Format the time with AM/PM
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format time for database
  const formatTimeForDB = (date) => {
    if (!date) return null;
    return date instanceof Date ? 
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : 
      null;
  };
  
  // Format date for database
  const formatDateForDB = (date) => {
    if (!date) return null;
    return date instanceof Date ? 
      `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : 
      null;
  };

  // Handle form submission to update the entry
  const handleUpdateEntry = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate current timestamp for update
      const currentTimestamp = new Date().toISOString();
      
      // Create the data object for update
      const entryData = {
        Name: staffName,
        Date: formatDateForDB(currentEntry.date),
        Presence: Boolean(currentEntry.presence),
        Client: currentEntry.presence ? currentEntry.client : null,
        Assignment: currentEntry.presence ? currentEntry.assignment : null,
        Work_Done: currentEntry.presence ? currentEntry.workDescription : null,
        Remark: currentEntry.presence ? currentEntry.remarks : null,
        Financial_Year: currentEntry.presence ? Number(currentEntry.financialYear) : 0,
        Start_Time: currentEntry.presence ? formatTimeForDB(currentEntry.startTime) : null,
        End_Time: currentEntry.presence ? formatTimeForDB(currentEntry.endTime) : null,
        Hours: currentEntry.presence ? Number(currentEntry.hours) : 0,
        Completion: currentEntry.presence ? Boolean(currentEntry.completion) : null,
        TimeStamp: currentTimestamp // Update the timestamp
      };
      
      console.log('Updating data in Supabase:', entryData);

      // Perform the update
      const { data, error } = await supabase
        .from('Staff Work')
        .update(entryData)
        .eq('No', currentEntry.No); // Using the primary key for the update

      if (error) {
        throw error;
      }

      console.log("Data updated successfully");
      setSuccess("Work entry updated successfully!");
      
      // Update the local state to reflect the changes
      setWorkEntries(workEntries.map(entry => 
        entry.id === currentEntry.id ? { ...entry, ...entryData } : entry
      ));
      
      // Close the dialog
      setEditDialogOpen(false);
      
      // Navigate back to staff dashboard after a short delay to show success message
      setTimeout(() => {
        navigate('/staffdashboard');
      }, 1500); // 1.5 second delay to allow user to see success message
      
    }
    catch (error) {
      console.error("Error updating entry:", error);
      setError(`Failed to update: ${error.message}`);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Edit dialog component
  const renderEditDialog = () => {
    if (!currentEntry) return null;
    
    return (
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Edit Work Entry</Typography>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              {/* Date and Presence */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Date"
                  value={currentEntry.date}
                  onChange={(newDate) => setCurrentEntry({...currentEntry, date: newDate})}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentEntry.presence}
                        onChange={(e) => setCurrentEntry({...currentEntry, presence: e.target.checked})}
                        color="primary"
                      />
                    }
                    label={currentEntry.presence ? "Present" : "Absent"}
                  />
                </FormControl>
              </Grid>

              {/* Client and Assignment */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={clientList}
                  value={currentEntry.client}
                  onChange={(event, newValue) => {
                    setCurrentEntry({...currentEntry, client: newValue || ''});
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client"
                      required={currentEntry.presence}
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={!currentEntry.presence}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={assignmentList}
                  value={currentEntry.assignment}
                  onChange={(event, newValue) => {
                    setCurrentEntry({...currentEntry, assignment: newValue || ''});
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assignment"
                      required={currentEntry.presence}
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={!currentEntry.presence}
                />
              </Grid>

              {/* Financial Year and Completion */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!currentEntry.presence}>
                  <InputLabel id="financial-year-label">Financial Year</InputLabel>
                  <Select
                    labelId="financial-year-label"
                    value={currentEntry.financialYear}
                    onChange={(e) => setCurrentEntry({...currentEntry, financialYear: Number(e.target.value)})}
                    label="Financial Year"
                    required={currentEntry.presence}
                  >
                    {financialYears.map(year => (
                      <MenuItem key={year} value={Number(year)}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!currentEntry.presence}>
                  <InputLabel id="completion-label">Completion Status</InputLabel>
                  <Select
                    labelId="completion-label"
                    value={currentEntry.completion ? "true" : "false"}
                    onChange={(e) => setCurrentEntry({...currentEntry, completion: e.target.value === "true"})}
                    label="Completion Status"
                    required={currentEntry.presence}
                  >
                    <MenuItem value="true">Completed</MenuItem>
                    <MenuItem value="false">In Progress</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Time Tracking */}
              <Grid item xs={12} md={4}>
                <TimePicker
                  label="Start Time"
                  value={currentEntry.startTime}
                  onChange={(newTime) => handleTimeChange('startTime', newTime)}
                  renderInput={(params) => <TextField {...params} fullWidth required={currentEntry.presence} />}
                  disabled={!currentEntry.presence}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TimePicker
                  label="End Time"
                  value={currentEntry.endTime}
                  onChange={(newTime) => handleTimeChange('endTime', newTime)}
                  renderInput={(params) => <TextField {...params} fullWidth required={currentEntry.presence} />}
                  disabled={!currentEntry.presence}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Hours Worked"
                  type="number"
                  inputProps={{ step: "0.1", min: "0" }}
                  value={currentEntry.hours}
                  onChange={handleHoursChange}
                  required={currentEntry.presence}
                  fullWidth
                  disabled={!currentEntry.presence}
                  helperText={`Calculated: ${currentEntry.calculatedHours} hrs`}
                />
              </Grid>

              {/* Work Description */}
              <Grid item xs={12}>
                <TextField
                  label="Work Description"
                  multiline
                  rows={3}
                  value={currentEntry.workDescription || ''}
                  onChange={(e) => setCurrentEntry({...currentEntry, workDescription: e.target.value})}
                  fullWidth
                  required={currentEntry.presence}
                  disabled={!currentEntry.presence}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  label="Remarks (Optional)"
                  multiline
                  rows={2}
                  value={currentEntry.remarks || ''}
                  onChange={(e) => setCurrentEntry({...currentEntry, remarks: e.target.value})}
                  fullWidth
                  disabled={!currentEntry.presence}
                  placeholder="Add any additional comments or notes here"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateEntry} 
            color="primary" 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!staffName) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Work History
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Staff: {staffName}
            </Typography>
            <Chip 
              label="Past 7 Days"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
        
        {/* Success Alert */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Work Entries List */}
        {!loading && workEntries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" color="textSecondary">
              No work entries found for the past week
            </Typography>
          </Box>
        )}

        {!loading && workEntries.length > 0 && (
          <List sx={{ width: '100%' }}>
            {workEntries.map((entry) => (
              <Card key={entry.id} sx={{ mb: 2, borderLeft: entry.Presence ? 'none' : '4px solid #ff9800' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(entry.Date)}
                      </Typography>
                    </Grid>
                    
                    {entry.Presence ? (
                      <>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Client
                          </Typography>
                          <Typography variant="body1">
                            {entry.Client || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Assignment
                          </Typography>
                          <Typography variant="body1">
                            {entry.Assignment || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip 
                            label={entry.Completion ? "Completed" : "In Progress"} 
                            color={entry.Completion ? "success" : "warning"}
                            size="small"
                          />
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12} sm={9}>
                        <Chip 
                          label="Absent" 
                          color="warning"
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                    )}
                  </Grid>
                  
                  {entry.Presence && (
                    <>
                      <IconButton
                        onClick={() => handleExpandClick(entry.id)}
                        aria-expanded={expandedId === entry.id}
                        aria-label="show more"
                        size="small"
                        sx={{ mt: 1 }}
                      >
                        {expandedId === entry.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        <Typography variant="button" sx={{ ml: 1 }}>
                          {expandedId === entry.id ? "Hide Details" : "Show Details"}
                        </Typography>
                      </IconButton>
                      
                      <Collapse in={expandedId === entry.id} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2, ml: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Time
                              </Typography>
                              <Typography variant="body2">
                                {formatTime(entry.Start_Time)} - {formatTime(entry.End_Time)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Hours
                              </Typography>
                              <Typography variant="body2">
                                {entry.Hours || 0}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Financial Year
                              </Typography>
                              <Typography variant="body2">
                                {entry.Financial_Year || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Work Description
                              </Typography>
                              <Typography variant="body2">
                                {entry.Work_Done || 'No description provided'}
                              </Typography>
                            </Grid>
                            {entry.Remark && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Remarks
                                </Typography>
                                <Typography variant="body2">
                                  {entry.Remark}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Collapse>
                    </>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<EditIcon />}
                    color="primary"
                    size="small"
                    onClick={() => handleEditClick(entry)}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            ))}
          </List>
        )}
        
        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/staffdashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dataentry')}
          >
            Add New Entry
          </Button>
        </Box>
      </Paper>
      
      {/* Edit Dialog */}
      {renderEditDialog()}
      
    </Container>
  );
};

export default DataEdit;