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
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Collapse,
  Autocomplete,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

const DataEntry = () => {
  const navigate = useNavigate();
  const staffName = localStorage.getItem('currentStaff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0-based for Material-UI Stepper
  const [error, setError] = useState(null);
  
  // Lists that will be fetched from Supabase
  const [clientList, setClientList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);
  const [financialYears, setFinancialYears] = useState(['2023', '2024', '2025']);
  const [loading, setLoading] = useState(true);
  
  // Default form data with explicit types
  const [formData, setFormData] = useState({
    date: new Date(),
    presence: true, 
    client: '',
    assignment: '',
    workDescription: '',
    remarks: '', // Added remarks field
    financialYear: 2024, 
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    hours: 8,
    calculatedHours: 8, // New field to store calculated hours
    completion: true
  });

  // Fetch client list and assignment list from Supabase
  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
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
        console.error("Error fetching data:", error);
        setError(`Failed to load data: ${error.message}`);
        // Fallback assignments if fetch fails
        setAssignmentList(['Audit', 'Tax Return', 'Consulting', 'Bookkeeping']);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLists();
  }, []);

  useEffect(() => {
    if (!staffName) {
      navigate('/signin');
    }
  }, [staffName, navigate]);


  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!formData.presence) {
      // If absent, reset all fields except date and presence
      setFormData({
        ...formData,
        client: '',
        assignment: '',
        workDescription: '',
        remarks: '', // Reset remarks field
        financialYear: 0,
        startTime: null,
        endTime: null,
        hours: 0,
        calculatedHours: 0,
        completion: null
      });
      
      // Submit immediately if absent and navigate back to dashboard
      const success = await submitData();
      if (success) navigate('/staffdashboard');
    } else {
      // If present, proceed to next step
      setStep(1);
    }
  };

  const handleDetailSubmit = async (e) => {
    e.preventDefault();
    
    // Check if entered hours match calculated hours (with 0.5 hour tolerance)
    const hoursDifference = Math.abs(formData.hours - formData.calculatedHours);
    
    // If difference is greater than 0.5 hours (except for the exact 0.5 difference which is allowed)
    // This is where we check the 0.5 hour tolerance - we ignore exactly 0.5 difference
    if (hoursDifference > 0.5 && hoursDifference !== 0.5) {
      setError(`Hours entered (${formData.hours}) don't match the calculated hours (${formData.calculatedHours}). 
                Please correct your entries. Note: A difference of exactly 0.5 hours is acceptable.`);
      
      // Refresh the page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return;
    }
    
    const success = await submitData();
    if (success) navigate('/staffdashboard');
  };

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const diffMs = endTime - startTime;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return Number(diffHrs.toFixed(1));
  };

  const handleTimeChange = (field, value) => {
    const newData = {
      ...formData,
      [field]: value
    };
    
    if (field === 'startTime' || field === 'endTime') {
      if (newData.startTime && newData.endTime) {
        const calculatedHrs = calculateHours(newData.startTime, newData.endTime);
        newData.calculatedHours = calculatedHrs;
        // Auto-fill the hours field with calculated hours but allow user to change it
        if (field === 'endTime' && !formData.hasUserEditedHours) {
          newData.hours = calculatedHrs;
        }
      }
    }
    
    setFormData(newData);
  };

  // New handler for when user manually changes hours
  const handleHoursChange = (e) => {
    setFormData({
      ...formData,
      hours: Number(e.target.value),
      hasUserEditedHours: true // Flag to track if user has manually edited hours
    });
  };

  const submitData = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Format times for database
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
      
      // Generate current timestamp for submission
      const currentTimestamp = new Date().toISOString();
      
      // Create the data object with explicit types that match the database
      const entryData = {
        Name: staffName,
        Date: formatDateForDB(formData.date),
        Presence: Boolean(formData.presence),
        // Conditionally set other fields based on presence
        Client: formData.presence ? formData.client : null,
        Assignment: formData.presence ? formData.assignment : null,
        Work_Done: formData.presence ? formData.workDescription : null,
        Remark: formData.presence ? formData.remarks : null, // Added remarks field
        Financial_Year: formData.presence ? Number(formData.financialYear) : 0,
        Start_Time: formData.presence ? formatTimeForDB(formData.startTime) : null,
        End_Time: formData.presence ? formatTimeForDB(formData.endTime) : null,
        Hours: formData.presence ? Number(formData.hours) : 0,
        Completion: formData.presence ? Boolean(formData.completion) : null,
        TimeStamp: currentTimestamp // Add the timestamp field
      };
      
      console.log('Submitting Data to Supabase:', entryData);

      console.log('Data types:', {
        Name: typeof entryData.Name,
        Date: typeof entryData.Date,
        Presence: typeof entryData.Presence,
        Client: typeof entryData.Client,
        Assignment: typeof entryData.Assignment,
        Work_Done: typeof entryData.Work_Done,
        Remark: typeof entryData.Remarks, // Added remarks field type
        Financial_Year: typeof entryData.Financial_Year,
        Start_Time: typeof entryData.Start_Time,
        End_Time: typeof entryData.End_Time,
        Hours: typeof entryData.Hours,
        Completion: typeof entryData.Completion,
        Timestamp: typeof entryData.Timestamp
      });

      // Try fetching the table structure first to verify connection
      const { data: tableInfo, error: tableError } = await supabase
        .from('Staff Work')
        .select('*')
        .limit(0);
          
      if (tableError) {
        console.error("Error accessing table:", tableError);
        setError(`Table access error: ${tableError.message}`);
        setIsSubmitting(false);
        return false;
      }
      
      console.log("Table accessed successfully");

      // Now attempt the insert
      const { data, error } = await supabase
        .from('Staff Work')
        .insert([entryData]);

      if (error) {
        console.error("Error Inserting Data:", error);
        setError(`Insert error: ${error.message} (Code: ${error.code})`);
        setIsSubmitting(false);
        return false;
      }

      console.log("Data submitted successfully:", data);
      setIsSubmitting(false);
      return true;
    }
    catch (error) {
      console.error("Exception during submission:", error);
      setError(`Unexpected error: ${error.message}`);
      setIsSubmitting(false);
      return false;
    }
  };

  if (!staffName) {
    return null;
  }

  const steps = ['Attendance', 'Work Details'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Data Entry Portal
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Staff: {staffName}
              </Typography>
              <Chip 
                label={`Step ${step + 1} of ${steps.length}`}
                color={step === 0 ? "primary" : "success"}
                variant="outlined"
              />
            </Box>
          </Box>
          
          {/* Stepper */}
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Step 1: Attendance */}
          {step === 0 && (
            <form onSubmit={handleAttendanceSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(newDate) => setFormData({...formData, date: newDate})}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.presence}
                          onChange={(e) => setFormData({...formData, presence: e.target.checked})}
                          color="primary"
                        />
                      }
                      label={formData.presence ? "Present" : "Absent"}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<HomeIcon />}
                      onClick={() => navigate('/staffdashboard')}
                    >
                      Home
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || isSubmitting}
                      sx={{
                        ml:1,
                        height:40 
                      }}
                    >
                      {!formData.presence && isSubmitting ? 'Submitting...' : 'Continue'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}

          {/* Step 2: Work Details */}
          {step === 1 && (
            <form onSubmit={handleDetailSubmit}>
              <Grid container spacing={2}>
                {/* Client selection */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={clientList}
                    value={formData.client}
                    onChange={(event, newValue) => {
                      setFormData({...formData, client: newValue || ''});
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client"
                        required
                        sx={{
                          width:'250px'
                        }}
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
                    disabled={loading}
                  />
                </Grid>

                {/* Assignment selection */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={assignmentList}
                    value={formData.assignment}
                    onChange={(event, newValue) => {
                      setFormData({...formData, assignment: newValue || ''});
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Assignment"
                        required
                        sx={{
                          width:'250px'
                        }}
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
                    disabled={loading}
                  />
                </Grid>

                {/* Financial Year */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="financial-year-label">Financial Year</InputLabel>
                    <Select
                      labelId="financial-year-label"
                      value={formData.financialYear}
                      onChange={(e) => setFormData({...formData, financialYear: Number(e.target.value)})}
                      label="Financial Year"
                      required
                      sx={{
                        width:'150px'
                      }}
                    >
                      {financialYears.map(year => (
                        <MenuItem key={year} value={Number(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Completion Status */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="completion-label">Completion Status</InputLabel>
                    <Select
                      labelId="completion-label"
                      value={formData.completion ? "true" : "false"}
                      onChange={(e) => setFormData({...formData, completion: e.target.value === "true"})}
                      label="Completion Status"
                      required
                      sx={{
                        width:'150px',
                        mr:'20px'
                      }}
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
                    value={formData.startTime}
                    onChange={(newTime) => handleTimeChange('startTime', newTime)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    sx={{
                      width:'150px',
                      mr:'20px'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newTime) => handleTimeChange('endTime', newTime)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    sx={{
                      width:'155px',
                      mr:'20px'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Hours Worked"
                    type="number"
                    inputProps={{ step: "0.1", min: "0" }}
                    value={formData.hours}
                    onChange={handleHoursChange}
                    required
                    sx={{
                      width:'120px'
                    }}
                    fullWidth
                  />
                </Grid>

                {/* Work Description */}
                <Grid item xs={12}>
                  <TextField
                    label="Work Description"
                    multiline
                    rows={3}
                    value={formData.workDescription}
                    onChange={(e) => setFormData({...formData, workDescription: e.target.value})}
                    fullWidth
                    required
                    sx={{
                      width:'345px'
                    }}
                  />
                </Grid>
                
                
                {/* Remarks field */}
                <Grid item xs={12}>
                  <TextField
                    id="remarks-field"
                    name="remarks"
                    label="Remarks (Optional)"
                    multiline
                    rows={3}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    fullWidth
                    variant="outlined"
                    placeholder="Add any additional comments or notes here"
                    sx={{ 
                      mb: 2,
                    width:'325px'
                   }}
                  />
                </Grid>

                {/* Form Actions */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setStep(0)}
                      sx={{
                        width:'120px'
                      }}
                    >
                      Back
                    </Button>
                    <Box>
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />}
                        disabled={isSubmitting || loading}
                        sx={{
                          ml:'160px'
                        }}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default DataEntry;