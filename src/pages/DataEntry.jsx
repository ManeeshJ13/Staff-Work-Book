import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { financialYears } from '../lib/dataLists';

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
  ArrowBack as ArrowBackIcon,
  Assignment
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
  const [hoursWarning, setHoursWarning] = useState(null);
  const [hoursPerClient, sethoursPerClient] = useState(0);

  const [clientList, setClientList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date(),
    presence: true,
    clients: [],
    assignment: '',
    workDescription: '',
    remarks: '',
    financialYear: financialYears[2],
    startTime: new Date(new Date().setHours(9, 30, 0, 0)),
    endTime: new Date(new Date().setHours(17, 30, 0, 0)),
    hours: 8,
    calculatedHours: 8,
    hasUserEditedHours: false,
    completion: false,
    ready_for_billing: false,
  });

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('Clients List')
          .select('Client_Name');
        if (clientError) throw clientError;

        const { data: assignmentData, error: assignmentError } = await supabase
          .from('Assignments List')
          .select('Assignment_Name');
        if (assignmentError) throw assignmentError;

        const sortedClients = clientData
          .map(item => item.Client_Name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setClientList(sortedClients);

        const sortedAssignments = assignmentData
          .map(item => item.Assignment_Name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setAssignmentList(sortedAssignments);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`Failed to load data: ${error.message}`);
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

  useEffect(() => {
    if (formData.clients.length > 0 && formData.hours > 0) {
      sethoursPerClient((formData.hours / formData.clients.length).toFixed(2));
    } else {
      sethoursPerClient(0);
    }
  }, [formData.clients, formData.hours]);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.presence) {
      setFormData({
        ...formData,
        client: [],
        assignment: '',
        workDescription: '',
        remarks: '',
        financialYear: '',
        startTime: null,
        endTime: null,
        hours: 0,
        calculatedHours: 0,
        completion: null,
        ready_for_billing: null,
      });
      const success = await submitData();
      if (success) navigate('/staffdashboard');
    } else {
      setStep(1);
    }
  };

  const handleDetailSubmit = async (e) => {
    e.preventDefault();
    if (formData.clients.length === 0) {
      setError('Please select atleast one client');
      return;
    }
    setError(null);
    const hoursDifference = Math.abs(formData.hours - formData.calculatedHours);
    if (hoursDifference > 0.1) {
      setHoursWarning(`Warning: Hours entered (${formData.hours}) don't match the calculated hours (${formData.calculatedHours}). Please double-check your entries.`);
    } else {
      setHoursWarning(null);
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
    const newData = { ...formData, [field]: value };
    if (field === 'startTime' || field === 'endTime') {
      if (newData.startTime && newData.endTime) {
        const calculatedHrs = calculateHours(newData.startTime, newData.endTime);
        newData.calculatedHours = calculatedHrs;
        if (field === 'endTime' && !formData.hasUserEditedHours) {
          newData.hours = calculatedHrs;
        }
      }
    }
    setFormData(newData);
    if (field === 'startTime' || field === 'endTime') {
      setHoursWarning(null);
    }
  };

  const handleHoursChange = (e) => {
    const newHours = Number(e.target.value);
    setFormData({ ...formData, hours: newHours, hasUserEditedHours: true });
    const hoursDifference = Math.abs(newHours - formData.calculatedHours);
    if (hoursDifference > 0.1) {
      setHoursWarning(`Warning: Hours entered (${newHours}) don't match the calculated hours (${formData.calculatedHours}). Please double-check your entries.`);
    } else {
      setHoursWarning(null);
    }
  };

  const submitData = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const formatTimeForDB = (date) => {
        if (!date) return null;
        return date instanceof Date ?
          `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : null;
      };
      const formatDateForDB = (date) => {
        if (!date) return null;
        return date instanceof Date ?
          `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
      };

      const currentTimestamp = new Date().toISOString();
      const hoursPerClientValue = formData.presence && formData.clients.length > 0
        ? Number((formData.hours / formData.clients.length).toFixed(2))
        : 0;

      const entries = [];

      if (!formData.presence) {
        entries.push({
          Name: staffName,
          Date: formatDateForDB(formData.date),
          Presence: false,
          Client: null,
          Assignment: null,
          Work_Done: null,
          Remark: null,
          Financial_Year: '',
          Start_Time: null,
          End_Time: null,
          Hours: 0,
          Completion: null,
          Ready_for_Billing: null,
          TimeStamp: currentTimestamp
        });
      } else {
        formData.clients.forEach(client => {
          entries.push({
            Name: staffName,
            Date: formatDateForDB(formData.date),
            Presence: true,
            Client: client,
            Assignment: formData.assignment,
            Work_Done: formData.workDescription,
            Remark: formData.remarks,
            Financial_Year: formData.financialYear,
            Start_Time: formatTimeForDB(formData.startTime),
            End_Time: formatTimeForDB(formData.endTime),
            Hours: hoursPerClientValue,
            Completion: Boolean(formData.completion),
            Ready_for_Billing: Boolean(formData.ready_for_billing),
            TimeStamp: currentTimestamp
          });
        });
      }

      console.log('Submitting Data to Supabase:', entries);

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

      const { data, error } = await supabase
        .from('Staff Work')
        .insert(entries);

      if (error) {
        console.error("Error Inserting Data:", error);
        setError(`Insert error: ${error.message} (Code: ${error.code})`);
        setIsSubmitting(false);
        return false;
      }

      console.log("Data submitted successfully:", data);
      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error("Exception during submission:", error);
      setError(`Unexpected error: ${error.message}`);
      setIsSubmitting(false);
      return false;
    }
  };

  if (!staffName) return null;

  const steps = ['Attendance', 'Work Details'];

  const getContainerWidth = () => {
    if (isMobile) return 'xs';
    if (isTablet) return 'sm';
    return 'md';
  };

  const getInputSize = () => isMobile ? 'small' : 'medium';

  const spacing = {
    gridSpacing: isMobile ? 1.5 : 2,
    marginBottom: isMobile ? 2 : 3,
    padding: isMobile ? 2 : 3,
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth={getContainerWidth()}
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Paper
          elevation={isMobile ? 1 : 3}
          sx={{
            p: spacing.padding,
            borderRadius: { xs: 1, sm: 2 },
            flexGrow: 1,
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: spacing.marginBottom
          }}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              fontWeight={600}
            >
              Work Entry
            </Typography>
            <Chip
              label={staffName}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
            />
          </Box>

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

          {error && (
            <Alert severity="error" sx={{ mb: spacing.marginBottom }}>
              {error}
            </Alert>
          )}

          {hoursWarning && (
            <Alert
              severity="warning"
              onClose={() => setHoursWarning('')}
              sx={{
                position: 'fixed',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                minWidth: '300px',
                maxWidth: '90vw',
                boxShadow: 3
              }}
            >
              {hoursWarning}
            </Alert>
          )}

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
                    onChange={(newDate) => setFormData({ ...formData, date: newDate })}
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
                          onChange={(e) => setFormData({ ...formData, presence: e.target.checked })}
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

                {/* Client */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={clientList}
                    value={formData.clients[0] || null}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, clients: newValue ? [newValue] : [] });
                      if (newValue) setError(null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client"
                        fullWidth
                        size={getInputSize()}
                        error={formData.clients.length === 0}
                        helperText={formData.clients.length === 0 ? "Please select a client" : ""}
                        sx={{ width: isMobile ? '100%' : '340px' }}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                    disabled={loading}
                    disablePortal
                  />
                </Grid>

                {/* Assignment */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={assignmentList}
                    value={formData.assignment || null}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, assignment: newValue || '' });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Assignment"
                        fullWidth
                        size={getInputSize()}
                        sx={{ width: isMobile ? '100%' : '300px' }}
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
                    disablePortal
                  />
                </Grid>

                {/* Financial Year */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="financial-year-label">Financial Year</InputLabel>
                    <Select
                      labelId="financial-year-label"
                      value={formData.financialYear}
                      onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                      label="Financial Year"
                      required
                      size={getInputSize()}
                      sx={{ width: '100%', textAlign: 'left' }}
                    >
                      {financialYears.map(year => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                

                {/* Work Description */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Work Description"
                      multiline
                      rows={isMobile ? 2 : 3}
                      value={formData.workDescription}
                      onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                      fullWidth
                      required
                      sx={{ width: isMobile ? '100%' : '400px' }}
                      size={getInputSize()}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Remarks (Optional)"
                      multiline
                      rows={isMobile ? 2 : 3}
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      fullWidth
                      variant="outlined"
                      placeholder="Add any additional comments or notes here"
                      sx={{ width: isMobile ? '100%' : '380px' }}
                      size={getInputSize()}
                    />
                  </Grid>
                </Grid>

                {/* Time Tracking */}
                <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Hours"
                    type="number"
                    value={formData.hours}
                    onChange={handleHoursChange}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: 0.5 }}
                    size={getInputSize()}
                    sx={{ width: isMobile ? '100%' : '120px' }}
                  />
                </Grid>

                {/* Completion Status Toggle */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%', pl: 1 }}>
                    <Typography variant="body1" sx={{ fontSize: getInputSize() === 'small' ? '0.875rem' : '1rem' }}>
                      Completion Status
                    </Typography>
                    <Switch
                      checked={Boolean(formData.completion)}
                      onChange={(e) => setFormData({ ...formData, completion: e.target.checked })}
                      color="success"
                    />
                    <Typography variant="body2" color={formData.completion ? "success.main" : "text.secondary"}>
                      {formData.completion ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Ready for Billing Toggle */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%', pl: 1 }}>
                    <Typography variant="body1" sx={{ fontSize: getInputSize() === 'small' ? '0.875rem' : '1rem' }}>
                      Ready for Billing
                    </Typography>
                    <Switch
                      checked={Boolean(formData.ready_for_billing)}
                      onChange={(e) => setFormData({ ...formData, ready_for_billing: e.target.checked })}
                      color="warning"
                    />
                    <Typography variant="body2" color={formData.ready_for_billing ? "warning.main" : "text.secondary"}>
                      {formData.ready_for_billing ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Form Actions */}
                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: isMobile ? 'center' : 'space-between',
                    gap: 2,
                    mt: 3,
                    ml: isMobile ? 0 : '300px'
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