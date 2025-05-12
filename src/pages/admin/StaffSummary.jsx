import React, { useState, useEffect, useRef } from "react";
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
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
} from "@mui/material";

// Material-UI icons
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import HomeIcon from "@mui/icons-material/Home";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const StaffSummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [staffHourlyRates, setStaffHourlyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [dateSearchTerm, setDateSearchTerm] = useState("");
  
  // Material-UI menu states
  const [staffMenuAnchorEl, setStaffMenuAnchorEl] = useState(null);
  const [dateMenuAnchorEl, setDateMenuAnchorEl] = useState(null);

  useEffect(() => {
    const fetchStaffWorkData = async () => {
      try {
        setLoading(true);
        const { data: workData, error: workError } = await supabase
          .from("Staff Work")
          .select("*")
          .eq("Presence", true) // Only fetch records where presence is true
          .order("Date", { ascending: false });

        if (workError) throw workError;

        setStaffWorkData(workData || []);
        setFilteredData(workData || []);

        // Extract unique dates from the data
        const uniqueDates = [...new Set(workData.map(item => item.Date))].filter(Boolean);
        uniqueDates.sort((a, b) => new Date(b) - new Date(a));
        setAvailableDates(uniqueDates);
      } catch (err) {
        console.error("Error fetching staff work data:", err);
        setError("Failed to load staff work data");
      } finally {
        setLoading(false);
      }
    };

    const fetchStaffHourlyRates = async () => {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from("Staff List")
          .select("Staff_Name, hourly_rate");

        if (staffError) throw staffError;

        setStaffHourlyRates(staffData || []);
      } catch (err) {
        console.error("Error fetching staff hourly rates:", err);
        setError("Failed to load staff hourly rates");
      }
    };

    fetchStaffWorkData();
    fetchStaffHourlyRates();
  }, []);

  useEffect(() => {
    let filtered = staffWorkData;

    if (selectedStaff) {
      filtered = filtered.filter(work => work.Name === selectedStaff);
    }

    if (selectedDate) {
      filtered = filtered.filter(work => work.Date === selectedDate);
    }

    setFilteredData(filtered);
  }, [selectedStaff, selectedDate, staffWorkData]);

  const handleStaffMenuOpen = (event) => {
    setStaffMenuAnchorEl(event.currentTarget);
  };

  const handleStaffMenuClose = () => {
    setStaffMenuAnchorEl(null);
  };

  const handleDateMenuOpen = (event) => {
    setDateMenuAnchorEl(event.currentTarget);
  };

  const handleDateMenuClose = () => {
    setDateMenuAnchorEl(null);
  };

  const handleStaffChange = (staff) => {
    setSelectedStaff(staff);
    handleStaffMenuClose();
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    handleDateMenuClose();
  };

  const handleClearStaffFilter = () => {
    setSelectedStaff("");
    setStaffSearchTerm("");
  };

  const handleClearDateFilter = () => {
    setSelectedDate("");
    setDateSearchTerm("");
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatBoolean = (value) => {
    if (value === null) return "N/A";
    return value;
  };

  const calculateTotalCost = (staffName, hours) => {
    if (!staffName || !hours) return "N/A";

    const staffRate = staffHourlyRates.find(staff => staff.Staff_Name === staffName);
    if (!staffRate) return "N/A";

    const totalCost = staffRate.hourly_rate * hours;
    return totalCost.toFixed(2);
  };

  const staffNames = [...new Set(staffWorkData.map(work => work.Name))].filter(Boolean).sort();

  // Filter staff based on search term
  const filteredStaff = staffNames.filter(staff =>
    staff && typeof staff === 'string' && 
    staff.toLowerCase().includes(staffSearchTerm?.toLowerCase() || '')
  );

  // Filter dates based on search term
  const filteredDates = availableDates.filter(date =>
    date && formatDate(date).toLowerCase().includes(dateSearchTerm?.toLowerCase() || '')
  );

  // Message to display when no data is found
  const getNoDataMessage = () => {
    if (selectedStaff && selectedDate) {
      return `No work records found for ${selectedStaff} on ${formatDate(selectedDate)}`;
    } else if (selectedStaff) {
      return `No work records found for ${selectedStaff}`;
    } else if (selectedDate) {
      return `No work records found for ${formatDate(selectedDate)}`;
    }
    return "No work records found";
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1400px", mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Staff Daily Work Summary
        </Typography>
        <Button
          component={Link}
          to="/admindash"
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
        >
          Home
        </Button>
      </Box>

      {/* Filter Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Staff Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="staff-select-label">Select Staff</InputLabel>
                <Select
                  labelId="staff-select-label"
                  id="staff-select"
                  value={selectedStaff}
                  label="Select Staff"
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  endAdornment={
                    selectedStaff && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleClearStaffFilter}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="">All Staff</MenuItem>
                  {staffNames.map((staff) => (
                    <MenuItem key={staff} value={staff}>
                      {staff}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="date-select-label">Select Date</InputLabel>
                <Select
                  labelId="date-select-label"
                  id="date-select"
                  value={selectedDate}
                  label="Select Date"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  endAdornment={
                    selectedDate && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleClearDateFilter}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="">All Dates</MenuItem>
                  {availableDates.map((date) => (
                    <MenuItem key={date} value={date}>
                      {formatDate(date)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>
            Loading staff work data...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredData.length > 0 ? (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Assignment</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Work Done</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Financial Year</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>End Time</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Completion</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Total Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((work, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{work.Name || "N/A"}</TableCell>
                  <TableCell>{formatDate(work.Date)}</TableCell>
                  <TableCell>{work.Client || "N/A"}</TableCell>
                  <TableCell>{work.Assignment || "N/A"}</TableCell>
                  <TableCell sx={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <Tooltip title={work.Work_Done || "N/A"} arrow>
                      <Typography noWrap>{work.Work_Done || "N/A"}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{work.Financial_Year || "N/A"}</TableCell>
                  <TableCell>{formatTime(work.Start_Time)}</TableCell>
                  <TableCell>{formatTime(work.End_Time)}</TableCell>
                  <TableCell>{work.Hours || "N/A"}</TableCell>
                  <TableCell>
                    {work.Completion !== null ? (
                      work.Completion ? (
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Yes" 
                          color="success" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          icon={<CancelIcon />} 
                          label="No" 
                          color="error" 
                          size="small" 
                        />
                      )
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    ₹{calculateTotalCost(work.Name, work.Hours)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "grey.50" }}>
          <Typography color="text.secondary">{getNoDataMessage()}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StaffSummary;