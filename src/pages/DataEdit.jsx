import React, { useState, useEffect, useCallback } from 'react';
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
  const [clientList, setClientList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);

  const getOneWeekAgo = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const parseTimeString = useCallback((timeString) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch {
      return null;
    }
  }, []);

  const calculateHours = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const diffMs = endTime - startTime;
    const diffHrs = diffMs / (1000 * 60 * 60);
    return Number(diffHrs.toFixed(1));
  }, []);

  const formatTimeForDB = useCallback((date) => {
    if (!date) return null;
    return date instanceof Date ?
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : null;
  }, []);

  const formatDateForDB = useCallback((date) => {
    if (!date) return null;
    return date instanceof Date ?
      `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
  }, []);

  useEffect(() => {
    const fetchLists = async () => {
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
        console.error("Error fetching lists:", error);
        setAssignmentList(['Audit', 'Tax Return', 'Consulting', 'Bookkeeping']);
      }
    };
    fetchLists();
  }, []);

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
        const oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('Staff Work')
          .select('*')
          .eq('Name', staffName)
          .gte('Date', oneWeekAgoFormatted)
          .order('Date', { ascending: false });
        if (error) throw error;
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

  useEffect(() => {
    if (!staffName) navigate('/signin');
  }, [staffName, navigate]);

  const handleExpandClick = useCallback((id) => {
    setExpandedId(expandedId === id ? null : id);
  }, [expandedId]);

  const handleEditClick = useCallback((entry) => {
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
      completion: entry.Completion !== null ? entry.Completion : false,
      ready_for_billing: entry.Ready_for_Billing !== null ? entry.Ready_for_Billing : false,
      presence: entry.Presence !== null ? entry.Presence : true,
    };
    setCurrentEntry(parsedEntry);
    setEditDialogOpen(true);
  }, [parseTimeString, calculateHours]);

  const handleTimeChange = useCallback((field, value) => {
    setCurrentEntry(prev => {
      const newData = { ...prev, [field]: value };
      if (newData.startTime && newData.endTime) {
        newData.calculatedHours = calculateHours(newData.startTime, newData.endTime);
      }
      return newData;
    });
  }, [calculateHours]);

  const handleDeleteEntry = async (entry) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('Staff Work')
        .delete()
        .eq('No', entry.No);
      if (error) throw error;
      setSuccess("Work entry deleted successfully!");
      setWorkEntries(workEntries.filter(e => e.id !== entry.id));
      setEditDialogOpen(false);
      setTimeout(() => navigate('/staffdashboard'), 1500);
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError(`Failed to delete: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEntry = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const currentTimestamp = new Date().toISOString();
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
        Ready_for_Billing: currentEntry.presence ? Boolean(currentEntry.ready_for_billing) : null,
        TimeStamp: currentTimestamp
      };

      const { data, error } = await supabase
        .from('Staff Work')
        .update(entryData)
        .eq('No', currentEntry.No);
      if (error) throw error;

      setSuccess("Work entry updated successfully!");
      setWorkEntries(workEntries.map(entry =>
        entry.id === currentEntry.id ? { ...entry, ...entryData } : entry
      ));
      setEditDialogOpen(false);
      setTimeout(() => navigate('/staffdashboard'), 1500);
    } catch (error) {
      console.error("Error updating entry:", error);
      setError(`Failed to update: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEditDialog = () => {
    if (!currentEntry) return null;
    return (
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
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
              sx={{ padding: isMobile ? 0.5 : 1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={isMobile ? 1.5 : 2} sx={{ pt: 1 }}>

              {/* Date and Presence */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={currentEntry.date}
                  onChange={(newDate) => setCurrentEntry({ ...currentEntry, date: newDate })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: isMobile ? "small" : "medium"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ height: '100%', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentEntry.presence}
                        onChange={(e) => setCurrentEntry({ ...currentEntry, presence: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={currentEntry.presence ? "Present" : "Absent"}
                  />
                </FormControl>
              </Grid>

              {/* Client */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={clientList}
                  value={currentEntry.client}
                  onChange={(event, newValue) => {
                    setCurrentEntry({ ...currentEntry, client: newValue || '' });
                  }}
                  disablePortal={isMobile}
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
                />
              </Grid>

              {/* Assignment */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={assignmentList}
                  value={currentEntry.assignment}
                  onChange={(event, newValue) => {
                    setCurrentEntry({ ...currentEntry, assignment: newValue || '' });
                  }}
                  disablePortal={isMobile}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assignment"
                      required={currentEntry.presence}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  disabled={!currentEntry.presence}
                />
              </Grid>

              {/* Financial Year */}
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
                    onChange={(e) => setCurrentEntry({ ...currentEntry, financialYear: Number(e.target.value) })}
                    label="Financial Year"
                    required={currentEntry.presence}
                    MenuProps={{ PaperProps: { style: { maxHeight: isMobile ? 200 : 300 } } }}
                  >
                    {financialYears.map(year => (
                      <MenuItem key={year} value={Number(year)} dense={isMobile}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Completion Status Toggle */}
              <Grid item xs={12} sm={6}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pl: 1,
                  opacity: currentEntry.presence ? 1 : 0.4
                }}>
                  <Typography variant="body1" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    Completion Status
                  </Typography>
                  <Switch
                    checked={Boolean(currentEntry.completion)}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, completion: e.target.checked })}
                    color="success"
                    disabled={!currentEntry.presence}
                  />
                  <Typography variant="body2" color={currentEntry.completion ? "success.main" : "text.secondary"}>
                    {currentEntry.completion ? "Yes" : "No"}
                  </Typography>
                </Box>
              </Grid>

              {/* Ready for Billing Toggle */}
              <Grid item xs={12} sm={6}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pl: 1,
                  opacity: currentEntry.presence ? 1 : 0.4
                }}>
                  <Typography variant="body1" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                    Ready for Billing
                  </Typography>
                  <Switch
                    checked={Boolean(currentEntry.ready_for_billing)}
                    onChange={(e) => setCurrentEntry({ ...currentEntry, ready_for_billing: e.target.checked })}
                    color="warning"
                    disabled={!currentEntry.presence}
                  />
                  <Typography variant="body2" color={currentEntry.ready_for_billing ? "warning.main" : "text.secondary"}>
                    {currentEntry.ready_for_billing ? "Yes" : "No"}
                  </Typography>
                </Box>
              </Grid>

              {/* Work Description */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Work Description"
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={currentEntry.workDescription}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, workDescription: e.target.value })}
                  fullWidth
                  required={currentEntry.presence}
                  disabled={!currentEntry.presence}
                  size={isMobile ? "small" : "medium"}
                  sx={{ maxHeight: isMobile ? '40vh' : '25vh' }}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Remarks (Optional)"
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={currentEntry.remarks || ''}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, remarks: e.target.value })}
                  fullWidth
                  disabled={!currentEntry.presence}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              {/* Time Tracking */}
              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="Start Time"
                  value={currentEntry.startTime}
                  onChange={(newTime) => handleTimeChange('startTime', newTime)}
                  disabled={!currentEntry.presence}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: currentEntry.presence,
                      size: isMobile ? "small" : "medium"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="End Time"
                  value={currentEntry.endTime}
                  onChange={(newTime) => handleTimeChange('endTime', newTime)}
                  disabled={!currentEntry.presence}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: currentEntry.presence,
                      size: isMobile ? "small" : "medium"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Hours"
                  type="number"
                  value={currentEntry.hours}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, hours: Number(e.target.value) })}
                  fullWidth
                  required={currentEntry.presence}
                  disabled={!currentEntry.presence}
                  inputProps={{ min: 0, step: 0.5 }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => handleDeleteEntry(currentEntry)}
            disabled={isSubmitting}
            size={isMobile ? "small" : "medium"}
          >
            Delete
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {isMobile && (
            <Button
              variant="outlined"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSubmitting}
              size="small"
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleUpdateEntry}
            disabled={isSubmitting}
            size={isMobile ? "small" : "medium"}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Paper elevation={isMobile ? 1 : 3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: { xs: 1, sm: 2 } }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600} sx={{ mb: 2 }}>
          Edit Work Entries
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing entries from the past 7 days
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : workEntries.length === 0 ? (
          <Alert severity="info">No work entries found for the past 7 days.</Alert>
        ) : (
          <List disablePadding>
            {workEntries.map((entry) => (
              <Card key={entry.No} variant="outlined" sx={{ mb: 1.5, borderRadius: 1 }}>
                <CardContent sx={{ pb: 0, px: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={500}>
                        {entry.Date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {entry.Presence ? (entry.Client || 'No client') : 'Absent'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {entry.Completion && (
                        <Chip label="Completed" color="success" size="small" />
                      )}
                      {entry.Ready_for_Billing && (
                        <Chip label="Ready for Billing" color="warning" size="small" />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleExpandClick(entry.No)}
                        aria-label={expandedId === entry.No ? 'collapse' : 'expand'}
                      >
                        {expandedId === entry.No ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={expandedId === entry.No} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1} sx={{ pb: 1 }}>
                      {entry.Presence && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Assignment</Typography>
                            <Typography variant="body2">{entry.Assignment || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="textSecondary">Hours</Typography>
                            <Typography variant="body2">{entry.Hours || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle2" color="textSecondary">Financial Year</Typography>
                            <Typography variant="body2">{entry.Financial_Year || 'N/A'}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Work Description</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {entry.Work_Done || 'No description provided'}
                            </Typography>
                          </Grid>
                          {entry.Remark && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="textSecondary">Remarks</Typography>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{entry.Remark}</Typography>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </Collapse>
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
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    size="small"
                    onClick={() => handleDeleteEntry(entry)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/staffdashboard')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dataentry')}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Add New Entry
          </Button>
        </Box>
      </Paper>

      {renderEditDialog()}
    </Container>
  );
};

export default DataEdit;