import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
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
  AlertTitle
} from '@mui/material';

const DailySummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [StaffHourlyRate, setStaffHourlyRate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format date as ISO string for Supabase query (YYYY-MM-DD)
  const queryDate = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchTodaysData = async () => {
      try {
        setLoading(true);
        // Query Supabase for today's records
        const { data, error } = await supabase
          .from("Staff Work")
          .select("*")
          .eq("Date", queryDate)
          .order("Start_Time", { ascending: true });

        if (error) throw error;
        setStaffWorkData(data || []);
      } catch (err) {
        console.error("Error fetching today's work data:", err);
        setError("Failed to load today's staff work data");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysData();
  }, [queryDate]);

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

  const calculateTotalCost = (staffName, hours) => {
    if (!staffName || !hours) return "N/A";
    
    const staffRate = StaffHourlyRate.find(staff => staff.Staff_Name === staffName);
    if (!staffRate) return "N/A";
    
    const totalCost = staffRate.hourly_rate * hours;
    return totalCost.toFixed(2);
  };

  return (
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

      {/* Today's Date Display */}
      <Paper elevation={1} sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h5" fontWeight="medium">
          {formattedDate}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Showing all work records for today
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Loading today's work data...
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
                <TableCell>Total Cost</TableCell>
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
                  <TableCell>₹{calculateTotalCost(work.Name, work.Hours)}</TableCell>
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
            No Data Available
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DailySummary;