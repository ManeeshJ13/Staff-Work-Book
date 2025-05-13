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
  Switch,
  FormControlLabel,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
  Autocomplete
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';

const DataEntry = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const staffName = localStorage.getItem('currentStaff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
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
    remarks: '',
    financialYear: 2024, 
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    hours: 8,
    calculatedHours: 8,
    hasUserEditedHours: false,
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
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        
        setClientList(sortedClients);

        // Process assignments
        const sortedAssignments = assignmentData
          .map(item => item.Assignment_Name)
          .filter(Boolean)
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
        remarks: '',
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
        Remark: formData.presence ? formData.remarks : null,
        Financial_Year: formData.presence ? Number(formData.financialYear) : 0,
        Start_Time: formData.presence ? formatTimeForDB(formData.startTime) : null,
        End_Time: formData.presence ? formatTimeForDB(formData.endTime) : null,
        Hours: formData.presence ? Number(formData.hours) : 0,
        Completion: formData.presence ? Boolean(formData.completion) : null,
        TimeStamp: currentTimestamp
      };
      
      console.log('Submitting Data to Supabase:', entryData);

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

  // Determine container width based on device
  const getContainerWidth = () => {
    if (isMobile) return 'xs';
    if (isTablet) return 'sm';
    return 'md';
  };

  // Determine input size based on device
  const getInputSize = () => {
    return isMobile ? 'small' : 'medium';
  };

  // Responsive spacing values
  const spacing = {
    containerPadding: isMobile ? 2 : 3,
    paperPadding: isMobile ? 2 : 4,
    gridSpacing: 2,
    marginBottom: isMobile ? 2 : 3
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container 
        maxWidth={getContainerWidth()}
        sx={{ 
          py: spacing.containerPadding,
          px: isMobile ? 1 : spacing.containerPadding,
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: spacing.paperPadding, 
            borderRadius: 2,
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Header */}
          <Box sx={{ mb: spacing.marginBottom, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom 
              align="center"
              sx={{ fontWeight: 'bold' }}
            >
              Data Entry Portal
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: 1
            }}>
              <Typography 
                variant="h6"
                sx={{ 
                  textAlign: { xs: 'center', sm: 'left' }, 
                  width: '100%',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Staff: {staffName}
              </Typography>
              <Chip 
                label={`Step ${step + 1} of ${steps.length}`}
                color={step === 0 ? "primary" : "success"}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
              />
            </Box>
          </Box>
          
          {/* Stepper - Adapts to screen width */}
          <Stepper 
            activeStep={step} 
            sx={{ 
              mb: spacing.marginBottom,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
            orientation={isMobile ? "vertical" : "horizontal"}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: spacing.marginBottom }}>
              {error}
            </Alert>
          )}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: spacing.marginBottom }}>
              <CircularProgress />
            </Box>
          )}

          {/* Step 1: Attendance */}
          {step === 0 && (
            <form onSubmit={handleAttendanceSubmit}>
              <Grid container spacing={spacing.gridSpacing}>
                <Grid item xs={12}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(newDate) => setFormData({...formData, date: newDate})}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        size: getInputSize()
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.presence}
                          onChange={(e) => setFormData({...formData, presence: e.target.checked})}
                          color="primary"
                          size={getInputSize()}
                        />
                      }
                      label={
                        <Typography variant={isMobile ? "body2" : "body1"}>
                          {formData.presence ? "Present" : "Absent"}
                        </Typography>
                      }
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    justifyContent: 'space-between', 
                    gap: 2,
                    mt: 2 
                  }}>
                    <Button
                      variant="outlined"
                      startIcon={<HomeIcon />}
                      onClick={() => navigate('/staffdashboard')}
                      fullWidth={isMobile}
                      size={getInputSize()}
                    >
                      Home
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading || isSubmitting}
                      fullWidth={isMobile}
                      size={getInputSize()}
                      sx={{ mt: { xs: 1, sm: 0 } }}
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
              <Grid container spacing={spacing.gridSpacing}>
                {/* Client selection */}
                <Grid item xs={12}>
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
                        fullWidth
                        size={getInputSize()}
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
                    disabled={loading}
                    disablePortal // Better performance on mobile
                  />
                </Grid>

                {/* Assignment selection */}
                <Grid item xs={12}>
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
                        fullWidth
                        size={getInputSize()}
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
                    disabled={loading}
                    disablePortal // Better performance on mobile
                  />
                </Grid>

                {/* Financial Year & Completion Status in one row on larger screens */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="financial-year-label">Financial Year</InputLabel>
                    <Select
                      labelId="financial-year-label"
                      value={formData.financialYear}
                      onChange={(e) => setFormData({...formData, financialYear: Number(e.target.value)})}
                      label="Financial Year"
                      required
                      size={getInputSize()}
                    >
                      {financialYears.map(year => (
                        <MenuItem key={year} value={Number(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="completion-label">Completion Status</InputLabel>
                    <Select
                      labelId="completion-label"
                      value={formData.completion ? "true" : "false"}
                      onChange={(e) => setFormData({...formData, completion: e.target.value === "true"})}
                      label="Completion Status"
                      required
                      size={getInputSize()}
                    >
                      <MenuItem value="true">Completed</MenuItem>
                      <MenuItem value="false">In Progress</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Time Tracking - Side by side on larger screens */}
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(newTime) => handleTimeChange('startTime', newTime)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        size: getInputSize()
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newTime) => handleTimeChange('endTime', newTime)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        size: getInputSize()
                      } 
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Hours Worked"
                    type="number"
                    inputProps={{ step: "0.1", min: "0" }}
                    value={formData.hours}
                    onChange={handleHoursChange}
                    required
                    fullWidth
                    size={getInputSize()}
                  />
                </Grid>

                {/* Work Description */}
                <Grid item xs={12}>
                  <TextField
                    label="Work Description"
                    multiline
                    rows={isMobile ? 2 : 3}
                    value={formData.workDescription}
                    onChange={(e) => setFormData({...formData, workDescription: e.target.value})}
                    fullWidth
                    required
                    size={getInputSize()}
                  />
                </Grid>
                
                {/* Remarks field */}
                <Grid item xs={12}>
                  <TextField
                    label="Remarks (Optional)"
                    multiline
                    rows={isMobile ? 2 : 3}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    fullWidth
                    variant="outlined"
                    placeholder="Add any additional comments or notes here"
                    size={getInputSize()}
                  />
                </Grid>

                {/* Form Actions */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    mt: 2,
                    gap: { xs: 2, sm: 2 }
                  }}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setStep(0)}
                      fullWidth={isMobile}
                      size={getInputSize()}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      disabled={isSubmitting || loading}
                      fullWidth={isMobile}
                      size={getInputSize()}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                    </Button>
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