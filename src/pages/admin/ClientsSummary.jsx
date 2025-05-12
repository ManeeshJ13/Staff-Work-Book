import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Button,
  Typography,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Chip,
  Autocomplete
} from "@mui/material";

const ClientsSummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffHourlyRates, setStaffHourlyRates] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");

  // Fetch client list from Supabase
  useEffect(() => {
    const fetchClientList = async () => {
      try {
        const { data, error } = await supabase
          .from("Clients List")
          .select("*");
        
        if (error) throw error;
        
        // Assuming the client list table has a column named 'Client_Name'
        const clients = data.map(item => item.Client_Name);
        // Sort clients alphabetically
        clients.sort((a, b) => a && b ? a.localeCompare(b) : 0);
        // Add "All Clients" option at the beginning
        setClientList(["All Clients", ...clients] || ["All Clients"]);
      } catch (err) {
        console.error("Error fetching client list:", err);
        setError("Failed to load client list");
      }
    };

    fetchClientList();
  }, []);

  // Fetch staff list and hourly rates from Supabase
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const { data, error } = await supabase
          .from("Staff List")
          .select("*");
        
        if (error) throw error;
        
        // Assuming the staff list table has columns 'name' and 'hourly_cost'
        const staffNames = data.map(item => item.Staff_Name);
        // Sort staff names alphabetically
        staffNames.sort((a, b) => a && b ? a.localeCompare(b) : 0);
        // Add "All Staff" option at the beginning
        setStaffList(["All Staff", ...staffNames] || ["All Staff"]);
        
        // Store hourly rates for cost calculation
        setStaffHourlyRates(data || []);
      } catch (err) {
        console.error("Error fetching staff list:", err);
        setError("Failed to load staff list");
      }
    };

    fetchStaffList();
  }, []);

  // Fetch staff work data
  useEffect(() => {
    const fetchStaffWorkData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("Staff Work")
          .select("*")
          .order("Date", { ascending: false });

        if (error) throw error;
        
        // Filter out data where Presence is false
        const filteredByPresence = data ? data.filter(work => work.Presence !== false) : [];
        
        setStaffWorkData(filteredByPresence);
        setFilteredData(filteredByPresence);
      } catch (err) {
        console.error("Error fetching staff work data:", err);
        setError("Failed to load staff work data");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffWorkData();
  }, []);

  // Filter data when client or staff selection changes
  useEffect(() => {
    let filtered = staffWorkData;
    
    if (selectedClient && selectedClient !== "All Clients") {
      filtered = filtered.filter(work => work.Client === selectedClient);
    }
    
    if (selectedStaff && selectedStaff !== "All Staff") {
      filtered = filtered.filter(work => work.Name === selectedStaff);
    }
    
    setFilteredData(filtered);
    
    // Calculate total cost from filtered data
    let sum = 0;
    filtered.forEach(work => {
      const cost = calculateTotalCostValue(work.Name, work.Hours);
      if (!isNaN(cost)) {
        sum += cost;
      }
    });
    setTotalCost(sum);
  }, [selectedClient, selectedStaff, staffWorkData, staffHourlyRates]);

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue || "All Clients");
  };

  const handleStaffChange = (event, newValue) => {
    setSelectedStaff(newValue || "All Staff");
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
    return value ? "Yes" : "No";
  };

  const calculateTotalCostValue = (staffName, hours) => {
    if (!staffName || !hours) return NaN;
    
    const staffRate = staffHourlyRates.find(staff => staff.Staff_Name === staffName);
    if (!staffRate) return NaN;
    
    return staffRate.hourly_rate * hours;
  };

  const calculateTotalCost = (staffName, hours) => {
    const cost = calculateTotalCostValue(staffName, hours);
    return isNaN(cost) ? "N/A" : cost.toFixed(2);
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      {/* Header with title and home button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Staff Work Summary
        </Typography>
        <Button 
          component={Link} 
          to="/admindash" 
          variant="contained" 
          color="primary"
          sx={{ px: 3, py: 1 }}
        >
          Home
        </Button>
      </Box>

      {/* Filter Selection Row */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 4 }}>
        {/* Client Selection Dropdown with Search */}
        <FormControl fullWidth>
          <Autocomplete
            value={selectedClient || "All Clients"}
            onChange={handleClientChange}
            options={clientList}
            renderInput={(params) => <TextField {...params} label="Select Client" />}
            disablePortal
            fullWidth
          />
        </FormControl>

        {/* Staff Selection Dropdown with Search */}
        <FormControl fullWidth>
          <Autocomplete
            value={selectedStaff || "All Staff"}
            onChange={handleStaffChange}
            options={staffList}
            renderInput={(params) => <TextField {...params} label="Select Staff" />}
            disablePortal
            fullWidth
          />
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading staff work data...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : filteredData.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">No data available</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="staff work table">
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.light" }}>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Presence</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Assignment</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Work Done</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Financial Year</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>End Time</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Completion</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Total Cost</TableCell>
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
                  <TableCell>
                    {work.Presence === true ? (
                      <Chip size="small" label="Yes" color="success" />
                    ) : work.Presence === false ? (
                      <Chip size="small" label="No" color="error" />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{work.Client || "N/A"}</TableCell>
                  <TableCell>{work.Assignment || "N/A"}</TableCell>
                  <TableCell>{work.Work_Done || "N/A"}</TableCell>
                  <TableCell>{work.Financial_Year || "N/A"}</TableCell>
                  <TableCell>{formatTime(work.Start_Time)}</TableCell>
                  <TableCell>{formatTime(work.End_Time)}</TableCell>
                  <TableCell>{work.Hours || "N/A"}</TableCell>
                  <TableCell>
                    {work.Completion === true ? (
                      <Chip size="small" label="Yes" color="success" />
                    ) : work.Completion === false ? (
                      <Chip size="small" label="No" color="warning" />
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>₹{calculateTotalCost(work.Name, work.Hours)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell colSpan={11} align="right" sx={{ fontWeight: "bold" }}>
                  Total Cost:
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  ₹{totalCost.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ClientsSummary;