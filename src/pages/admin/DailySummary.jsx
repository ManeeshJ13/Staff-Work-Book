import React, { useState, useEffect } from "react";
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
  TextField
} from '@mui/material';

function AdminPage(){
    return <div>Admin-Only Content</div>;
}
const DailySummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateList, setDateList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date();
  
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
  
  // Format today's date as ISO string for Supabase query (YYYY-MM-DD)
  const todayFormatted = today.toISOString().split('T')[0];

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
        
        // Set default selected date to today if available, otherwise the most recent date
        if (uniqueDates.includes(todayFormatted)) {
          setSelectedDate(todayFormatted);
        } else if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[0]);
        }
      } catch (err) {
        console.error("Error fetching available dates:", err);
        setError("Failed to load available dates");
      }
    };

    fetchAvailableDates();
  }, [todayFormatted]);

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
          .order("Start_Time", { ascending: true });

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

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBoolean = (value) => {
    if (value === null) return "N/A";
    return value ? "Yes" : "No";
  };

  return (
    <Box>
      <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Daily Work Summary
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/admindash"
          >
            Home
          </Button>
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

        {/* Selected Date Display */}
        {selectedDate && (
          <Paper elevation={1} sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h5" fontWeight="medium">
              {formatDisplayDate(selectedDate)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Showing all work records for the selected date
            </Typography>
          </Paper>
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
          <TableContainer component={Paper} elevation={2}>
            <Table aria-label="staff work table" size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Presence</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Work Done</TableCell>
                  <TableCell>Financial Year</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Completion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffWorkData.map((work, index) => (
                  <TableRow 
                    key={index}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{work.Name || "N/A"}</TableCell>
                    <TableCell>{formatBoolean(work.Presence)}</TableCell>
                    <TableCell>{work.Client || "N/A"}</TableCell>
                    <TableCell>{work.Assignment || "N/A"}</TableCell>
                    <TableCell>{work.Work_Done || "N/A"}</TableCell>
                    <TableCell>{work.Financial_Year || "N/A"}</TableCell>
                    <TableCell>{formatTime(work.Start_Time)}</TableCell>
                    <TableCell>{formatTime(work.End_Time)}</TableCell>
                    <TableCell>{work.Hours || "N/A"}</TableCell>
                    <TableCell>{formatBoolean(work.Completion)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
      </Box>
    </Box>
  );
};

export default withAuth(DailySummary);