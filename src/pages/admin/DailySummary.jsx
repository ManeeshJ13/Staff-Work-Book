import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import withAuth from "../../components/withAuth";
// Material-UI imports
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button,
  Typography, 
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  FormControl,
  Autocomplete,
  TextField,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
// SheetJS import for Excel functionality
import * as XLSX from 'xlsx';

const DailySummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateList, setDateList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [downloading, setDownloading] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const today = new Date();
  
  // Get yesterday's date
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format yesterday's date as ISO string for Supabase query (YYYY-MM-DD)
  const yesterdayFormatted = yesterday.toISOString().split('T')[0];

  useEffect(() => {
    // Function to fetch all available dates from the database
    const fetchAvailableDates = async () => {
      try {
        const { data, error } = await supabase
          .from("Staff Work")
          .select("Date")
          .order("Date", { ascending: false });
        
        if (error) throw error;
        
        // Extract unique dates
        const uniqueDates = [...new Set(data.map(item => item.Date))];
        setDateList(uniqueDates);
        
        // Set default selected date to yesterday if available, otherwise the most recent date
        if (uniqueDates.includes(yesterdayFormatted)) {
          setSelectedDate(yesterdayFormatted);
        } else if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[0]);
        }
      } catch (err) {
        console.error("Error fetching available dates:", err);
        setError("Failed to load available dates");
      }
    };

    fetchAvailableDates();
  }, [yesterdayFormatted]);

  useEffect(() => {
    // Function to fetch work data for the selected date
    const fetchWorkData = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        // Query Supabase for the selected date's records
        const { data, error } = await supabase
          .from("Staff Work")
          .select("*")
          .eq("Date", selectedDate)
          .order("Name", { ascending: true }); // Sort alphabetically by name

        if (error) throw error;
        setStaffWorkData(data || []);
      } catch (err) {
        console.error("Error fetching work data:", err);
        setError("Failed to load staff work data");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkData();
  }, [selectedDate]);

  const handleDateChange = (event, newValue) => {
    setSelectedDate(newValue);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !recordToDelete.No) {
      setSnackbarMessage("Cannot delete record: Missing record ID");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from("Staff Work")
        .delete()
        .eq("No", recordToDelete.No);

      if (error) throw error;

      // Remove the deleted record from the local state
      setStaffWorkData(prevData => 
        prevData.filter(record => record.id !== recordToDelete.id)
      );

      setSnackbarMessage("Record deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error("Error deleting record:", err);
      setSnackbarMessage("Failed to delete record");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Excel download function
  const handleDownloadExcel = async () => {
    if (!staffWorkData.length) {
      setSnackbarMessage("No data available to download");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      setDownloading(true);

      // Prepare data for Excel export
      const excelData = staffWorkData.map((work, index) => ({
        'S.No': index + 1,
        'Name': work.Name || 'N/A',
        'Date': selectedDate,
        'Presence': work.Presence === true ? 'Present' : work.Presence === false ? 'Absent' : 'N/A',
        'Client': work.Client || 'N/A',
        'Assignment': work.Assignment || 'N/A',
        'Work Done': work.Work_Done || 'N/A',
        'Financial Year': work.Financial_Year || 'N/A',
        'Start Time': formatTime(work.Start_Time),
        'End Time': formatTime(work.End_Time),
        'Hours': work.Hours || 'N/A',
        'Completion': work.Completion === true ? 'Completed' : work.Completion === false ? 'Incomplete' : 'N/A',
        'Timestamp': formatTimestamp(work.TimeStamp)
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 6 },   // S.No
        { wch: 20 },  // Name
        { wch: 12 },  // Date
        { wch: 10 },  // Presence
        { wch: 15 },  // Client
        { wch: 20 },  // Assignment
        { wch: 40 },  // Work Done
        { wch: 12 },  // Financial Year
        { wch: 12 },  // Start Time
        { wch: 12 },  // End Time
        { wch: 8 },   // Hours
        { wch: 12 },  // Completion
        { wch: 20 }   // Timestamp
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Summary');

      // Generate filename with date
      const dateForFileName = selectedDate ? selectedDate.replace(/-/g, '_') : 'unknown_date';
      const fileName = `Daily_Work_Summary_${dateForFileName}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, fileName);

      setSnackbarMessage("Excel file downloaded successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

    } catch (err) {
      console.error("Error downloading Excel file:", err);
      setSnackbarMessage("Failed to download Excel file");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatBoolean = (value) => {
    if (value === null) return "N/A";
    return value ? "Yes" : "No";
  };

  // Status chip for completion and presence
  const StatusChip = ({ value, label }) => {
    const color = value === true ? "success" : 
                 value === false ? "error" : 
                 "default";
    
    const icon = value === true ? <CheckCircleIcon fontSize="small" /> : 
                value === false ? <CancelIcon fontSize="small" /> : 
                null;
    
    return (
      <Chip 
        icon={icon}
        label={label || (value ? "Yes" : "No")}
        size="small"
        color={color}
        variant="outlined"
      />
    );
  };

  // Memoized hours summary calculation
  const hoursSummary = useMemo(() => {
    if (!staffWorkData.length) return { total: 0, average: 0 };
    
    const validHours = staffWorkData
      .map(work => Number(work.Hours) || 0)
      .filter(hours => !isNaN(hours));
    
    const total = validHours.reduce((sum, hours) => sum + hours, 0);
    const average = validHours.length ? (total / validHours.length).toFixed(1) : 0;
    
    return { total: total.toFixed(1), average };
  }, [staffWorkData]);

  // Render mobile card view for each work entry
  const renderMobileCards = () => (
    <Box sx={{ mt: 2 }}>
      {staffWorkData.map((work, index) => (
        <Card key={index} sx={{ mb: 2, boxShadow: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="div">
                {work.Name || "N/A"}
              </Typography>
              <Tooltip title="Delete Record">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeleteClick(work)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Client:
              </Typography>
              <Typography variant="body1">
                {work.Client || "N/A"}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Assignment:
              </Typography>
              <Typography variant="body1">
                {work.Assignment || "N/A"}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Time:
              </Typography>
              <Typography variant="body1">
                {formatTime(work.Start_Time)} - {formatTime(work.End_Time)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Hours:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {work.Hours || "N/A"}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Timestamp:
              </Typography>
              <Typography variant="body1">
                {formatTimestamp(work.TimeStamp) || "N/A"}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <StatusChip value={work.Presence} label={work.Presence ? "Present" : "Absent"} />
              <StatusChip value={work.Completion} label={work.Completion ? "Completed" : "Incomplete"} />
            </Box>
            
            {work.Work_Done && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Work Details:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {work.Work_Done}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton 
              component={Link} 
              to="/admindash" 
              sx={{ mr: 1 }}
              aria-label="Back to home"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            fontWeight="bold"
          >
            DAILY WORK SUMMARY
          </Typography>
        </Box>
        
        {!isMobile && (
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/admindash"
            startIcon={<ArrowBackIcon />}
          >
            Home
          </Button>
        )}
      </Box>

      {/* Date Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <Autocomplete
            value={selectedDate}
            onChange={handleDateChange}
            options={dateList}
            getOptionLabel={(option) => formatDisplayDate(option)}
            renderInput={(params) => <TextField {...params} label="Select Date" />}
            disablePortal
            fullWidth
            loading={dateList.length === 0}
            loadingText="Loading available dates..."
            noOptionsText="No dates available"
          />
        </FormControl>
      </Box>

      {/* Selected Date Display with Summary Stats */}
      {selectedDate && (
        <Paper elevation={1} sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="medium">
                {formatDisplayDate(selectedDate)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {staffWorkData.length} work records
              </Typography>
            </Grid>
            {staffWorkData.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: {xs: 'flex-start', md: 'flex-end'},
                  flexWrap: 'wrap', 
                  gap: 2 
                }}>
                  <Chip 
                    label={`Total: ${hoursSummary.total} hrs`} 
                    color="secondary" 
                    variant="filled" 
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Download Button */}
      {staffWorkData.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={downloading}
            sx={{ minWidth: 150 }}
          >
            {downloading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Download'
            )}
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Loading work data...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      ) : staffWorkData.length > 0 ? (
        isMobile ? (
          renderMobileCards()
        ) : (
          <TableContainer component={Paper} elevation={2} sx={{ width: '102%', overflowX: '-moz-hidden-unscrollable', }}>
            <Table aria-label="staff work table" size="small" sx={{ minWidth: 850}}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Presence</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Work Done</TableCell>
                  <TableCell>FY</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell align="center">Completion</TableCell>
                  <TableCell>TimeStamp</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffWorkData.map((work, index) => (
                  <TableRow 
                    key={index}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 'medium', maxWidth: 150}}>{work.Name || "N/A"}</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <StatusChip value={work.Presence} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 120 }}>{work.Client || "N/A"}</TableCell>
                    <TableCell sx={{ maxWidth: 150 }}>{work.Assignment || "N/A"}</TableCell>
                    <TableCell sx={{ width: '30%', minWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {work.Work_Done || "N/A"}
                    </TableCell>
                    <TableCell sx={{ width: 60 }}>{work.Financial_Year || "N/A"}</TableCell>
                    <TableCell sx={{ width: 140 }}>
                      {formatTime(work.Start_Time)} - {formatTime(work.End_Time)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium', width: 80 }}>
                      {work.Hours || "N/A"}
                    </TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>
                      <StatusChip value={work.Completion} />
                    </TableCell>
                    <TableCell sx={{ width: 140}}>{formatTimestamp(work.TimeStamp)}</TableCell>
                    <TableCell>
                       <Tooltip title="Delete Record">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(work)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No Data Available for Selected Date
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the work record for{' '}
            <strong>{recordToDelete?.Name || 'this staff member'}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default withAuth(DailySummary);