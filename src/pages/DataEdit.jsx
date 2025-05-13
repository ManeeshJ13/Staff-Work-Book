import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const getOneWeekAgo = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

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
  }, [staffName, navigate, getOneWeekAgo]);

  // Navigate to dashboard if not signed in
  useEffect(() => {
    if (!staffName) {
      navigate('/signin');
    }
  }, [staffName, navigate]);

  // Handle expanding/collapsing entry details
  const handleExpandClick = useCallback((id) => {
    setExpandedId(expandedId === id ? null : id);
  }, [expandedId]);

  // Open edit dialog for an entry
  const handleEditClick = useCallback((entry) => {
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
  }, []);

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
  const handleTimeChange = useCallback((field, value) => {
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
  }, [currentEntry]);

  // Handle hours change
  const handleHoursChange = useCallback((e) => {
    setCurrentEntry({
      ...currentEntry,
      hours: Number(e.target.value),
      hasUserEditedHours: true // Flag to track if user has manually edited hours
    });
  }, [currentEntry]);

  // Format time for display
  const formatTime = useCallback((timeStr) => {
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
  }, []);

  // Format time for database
  const formatTimeForDB = useCallback((date) => {
    if (!date) return null;
    return date instanceof Date ? 
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : 
      null;
  }, []);
  
  // Format date for database
  const formatDateForDB = useCallback((date) => {
    if (!date) return null;
    return date instanceof Date ? 
      `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : 
      null;
  }, []);

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
        fullScreen={isMobile} // Full screen on mobile devices
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 1,
            height: isMobile ? '100%' : 'auto',
            overflowY: 'auto'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {isMobile ? "Edit Entry" : "Edit Work Entry"}
            </Typography>
            <IconButton 
              onClick={() => setEditDialogOpen(false)}
              edge="end"
              aria-label="close"
              sx={{ 
                padding: isMobile ? 1 : 0.5,
                '&:active': {
                  backgroundColor: theme.palette.action.selected
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent 
          dividers
          sx={{ 
            paddingTop: isMobile ? 2 : 3,
            overflowY: 'auto',
            '-webkit-overflow-scrolling': 'touch' // Improves scrolling on iOS
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Date and Presence */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={currentEntry.date}
                  onChange={(newDate) => setCurrentEntry({...currentEntry, date: newDate})}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      size={isMobile ? "small" : "medium"} 
                      sx={{ mb: isMobile ? 1 : 0 }}
                    />
                  )}
                  PopperProps={{
                    placement: isMobile ? 'bottom' : 'bottom-start',
                    modifiers: [{
                      name: 'preventOverflow',
                      enabled: true,
                      options: {
                        boundary: document.body
                      }
                    }]
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: isMobile ? 'flex-start' : 'center' 
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentEntry.presence}
                        onChange={(e) => setCurrentEntry({...currentEntry, presence: e.target.checked})}
                        color="primary"
                        sx={{ 
                          '& .MuiSwitch-switchBase': {
                            padding: 0.5,
                          },
                          '& .MuiSwitch-thumb': {
                            width: isMobile ? 16 : 20,
                            height: isMobile ? 16 : 20,
                          },
                          '&:active': {
                            '& .MuiSwitch-thumb': {
                              width: isMobile ? 17 : 21,
                            },
                          }
                        }}
                      />
                    }
                    label={currentEntry.presence ? "Present" : "Absent"}
                  />
                </FormControl>
              </Grid>

              {/* Client and Assignment */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={clientList}
                  value={currentEntry.client}
                  onChange={(event, newValue) => {
                    setCurrentEntry({...currentEntry, client: newValue || ''});
                  }}
                  disablePortal={isMobile} // Better mobile experience
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client"
                      required={currentEntry.presence}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={!currentEntry.presence}
                  ListboxProps={{
                    style: {
                      maxHeight: isMobile ? '40vh' : '25vh'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={assignmentList}
                  value={currentEntry.assignment}
                  onChange={(event, newValue) => {
                    setCurrentEntry({...currentEntry, assignment: newValue || ''});
                  }}
                  disablePortal={isMobile} // Better mobile experience
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assignment"
                      required={currentEntry.presence}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={!currentEntry.presence}
                  ListboxProps={{
                    style: {
                      maxHeight: isMobile ? '40vh' : '25vh'
                    }
                  }}
                />
              </Grid>

              {/* Financial Year and Completion */}
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  disabled={!currentEntry.presence}
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel id="financial-year-label">Financial Year</InputLabel>
                  <Select
                    labelId="financial-year-label"
                    value={currentEntry.financialYear}
                    onChange={(e) => setCurrentEntry({...currentEntry, financialYear: Number(e.target.value)})}
                    label="Financial Year"
                    required={currentEntry.presence}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: isMobile ? 200 : 300
                        }
                      }
                    }}
                  >
                    {financialYears.map(year => (
                      <MenuItem 
                        key={year} 
                        value={Number(year)}
                        dense={isMobile}
                      >
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  disabled={!currentEntry.presence}
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel id="completion-label">Completion Status</InputLabel>
                  <Select
                    labelId="completion-label"
                    value={currentEntry.completion ? "true" : "false"}
                    onChange={(e) => setCurrentEntry({...currentEntry, completion: e.target.value === "true"})}
                    label="Completion Status"
                    required={currentEntry.presence}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: isMobile ? 200 : 300
                        }
                      }
                    }}
                  >
                    <MenuItem value="true" dense={isMobile}>Completed</MenuItem>
                    <MenuItem value="false" dense={isMobile}>In Progress</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Time Tracking */}
              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="Start Time"
                  value={currentEntry.startTime}
                  onChange={(newTime) => handleTimeChange('startTime', newTime)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required={currentEntry.presence} 
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  disabled={!currentEntry.presence}
                  PopperProps={{
                    placement: isMobile ? 'bottom' : 'bottom-start',
                    modifiers: [{
                      name: 'preventOverflow',
                      enabled: true,
                      options: {
                        boundary: document.body
                      }
                    }]
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="End Time"
                  value={currentEntry.endTime}
                  onChange={(newTime) => handleTimeChange('endTime', newTime)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required={currentEntry.presence} 
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  disabled={!currentEntry.presence}
                  PopperProps={{
                    placement: isMobile ? 'bottom' : 'bottom-start',
                    modifiers: [{
                      name: 'preventOverflow',
                      enabled: true,
                      options: {
                        boundary: document.body
                      }
                    }]
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Hours Worked"
                  type="number"
                  inputProps={{ 
                    step: "0.1", 
                    min: "0",
                    inputMode: 'decimal', // Brings up numeric keyboard on mobile
                    pattern: '[0-9]*(\.[0-9])?'
                  }}
                  value={currentEntry.hours}
                  onChange={handleHoursChange}
                  required={currentEntry.presence}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  disabled={!currentEntry.presence}
                  helperText={`Calculated: ${currentEntry.calculatedHours} hrs`}
                />
              </Grid>

              {/* Work Description */}
              <Grid item xs={12}>
                <TextField
                  label="Work Description"
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={currentEntry.workDescription || ''}
                  onChange={(e) => setCurrentEntry({...currentEntry, workDescription: e.target.value})}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  required={currentEntry.presence}
                  disabled={!currentEntry.presence}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    }
                  }}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  label="Remarks (Optional)"
                  multiline
                  rows={isMobile ? 2 : 2}
                  value={currentEntry.remarks || ''}
                  onChange={(e) => setCurrentEntry({...currentEntry, remarks: e.target.value})}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  disabled={!currentEntry.presence}
                  placeholder="Add any additional comments or notes here"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions
          sx={{
            padding: isMobile ? 2 : 1.5,
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            gap: isMobile ? 1 : 0
          }}
        >
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            color="primary"
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? 1 : 'auto',
              borderRadius: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateEntry} 
            color="primary" 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? 1 : 'auto',
              borderRadius: 1
            }}
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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Edit Work History
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 } }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Staff: {staffName}
            </Typography>
            <Chip 
              label="Past 7 Days"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mt: { xs: 1, sm: 0 } }}
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
            <Typography variant="h6" color="textSecondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              No work entries found for the past week
            </Typography>
          </Box>
        )}

        {!loading && workEntries.length > 0 && (
          <List sx={{ width: '100%', p: 0 }}>
            {workEntries.map((entry) => (
              <Card key={entry.id} sx={{ mb: 2, borderLeft: entry.Presence ? 'none' : '4px solid #ff9800' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Date
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {formatDate(entry.Date)}
                      </Typography>
                    </Grid>
                    
                    {entry.Presence ? (
                      <>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Client
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                            {entry.Client || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Assignment
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
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
                        <Typography variant="button" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}>
                          {expandedId === entry.id ? "Hide Details" : "Show Details"}
                        </Typography>
                      </IconButton>
                      
                      <Collapse in={expandedId === entry.id} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2, ml: { xs: 0, sm: 1 } }}>
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid item xs={6} sm={4}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Time
                              </Typography>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {formatTime(entry.Start_Time)} - {formatTime(entry.End_Time)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={4}>
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
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {entry.Work_Done || 'No description provided'}
                              </Typography>
                            </Grid>
                            {entry.Remark && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Remarks
                                </Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
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
                <CardActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/staffdashboard')}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dataentry')}
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
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