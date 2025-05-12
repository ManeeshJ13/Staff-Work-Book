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
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
  InputAdornment,
} from "@mui/material";

// Material-UI icons
import HomeIcon from "@mui/icons-material/Home";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const ClientAssignmentSummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [assignmentList, setAssignmentList] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [staffHourlyRates, setStaffHourlyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCost, setTotalCost] = useState(0);

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch staff work data
        const { data: workData, error: workError } = await supabase
          .from("Staff Work")
          .select("*")
          .order("Date", { ascending: false });

        if (workError) throw workError;

        // Filter out records where employees were absent
        const validWorkData = workData.filter(record => 
          record.Presence && 
          record.Presence !== "FALSE" 
        );
        
        setStaffWorkData(validWorkData || []);
        setFilteredData(validWorkData || []);

        // Fetch client list
        const { data: clients, error: clientError } = await supabase
          .from("Clients List")
          .select("Client_Name");

        if (clientError) throw clientError;
        
        const clientNames = clients.map(client => client.Client_Name);
        // Sort client names alphabetically
        const sortedClientNames = clientNames.sort((a, b) => 
          a && b ? a.localeCompare(b) : 0
        );
        setClientList(sortedClientNames || []);

        // Fetch assignment list
        const { data: assignments, error: assignmentError } = await supabase
          .from("Assignments List")
          .select("Assignment_Name");

        if (assignmentError) throw assignmentError;
        
        const assignmentNames = assignments.map(assignment => assignment.Assignment_Name);
        // Sort assignment names alphabetically
        const sortedAssignmentNames = assignmentNames.sort((a, b) => 
          a && b ? a.localeCompare(b) : 0
        );
        setAssignmentList(sortedAssignmentNames || []);

        // Fetch staff hourly rates
        const { data: staffData, error: staffError } = await supabase
          .from("Staff List")
          .select("Staff_Name, hourly_rate");

        if (staffError) throw staffError;
        
        const ratesData = staffData.map(staff => ({
          name: staff.Staff_Name,
          hourlyCost: staff.hourly_rate
        }));
        
        setStaffHourlyRates(ratesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Filter data when client or assignment selection changes
  useEffect(() => {
    let filtered = staffWorkData;
    
    if (selectedClient) {
      filtered = filtered.filter(work => work.Client === selectedClient);
    }
    
    if (selectedAssignment) {
      filtered = filtered.filter(work => work.Assignment === selectedAssignment);
    }
    
    setFilteredData(filtered);

    // Calculate total cost
    const total = filtered.reduce((sum, work) => {
      if (!work.Name || !work.Hours) return sum;
      
      const staffRate = staffHourlyRates.find(staff => staff.name === work.Name);
      if (!staffRate) return sum;
      
      return sum + (staffRate.hourlyCost * work.Hours);
    }, 0);
    
    setTotalCost(total);
  }, [selectedClient, selectedAssignment, staffWorkData, staffHourlyRates]);

  const handleClientChange = (event) => {
    setSelectedClient(event.target.value);
  };

  const handleAssignmentChange = (event) => {
    setSelectedAssignment(event.target.value);
  };

  const clearClientFilter = () => {
    setSelectedClient("");
  };

  const clearAssignmentFilter = () => {
    setSelectedAssignment("");
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

  const calculateIndividualCost = (staffName, hours) => {
    if (!staffName || !hours) return "N/A";
    
    const staffRate = staffHourlyRates.find(staff => staff.name === staffName);
    if (!staffRate) return "N/A";
    
    const cost = staffRate.hourlyCost * hours;
    return cost.toFixed(2);
  };

  const getNoDataMessage = () => {
    if (selectedClient && selectedAssignment) {
      return `No records found for ${selectedClient} with assignment ${selectedAssignment}`;
    } else if (selectedClient) {
      return `No records found for ${selectedClient}`;
    } else if (selectedAssignment) {
      return `No records found for assignment ${selectedAssignment}`;
    }
    return "No records found";
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1400px", mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Client and Assignment Summary
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
            {/* Client Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="client-select-label">Select Client</InputLabel>
                <Select
                  labelId="client-select-label"
                  id="client-select"
                  value={selectedClient}
                  label="Select Client"
                  onChange={handleClientChange}
                  
                  endAdornment={
                    selectedClient && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={clearClientFilter}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="">All Clients</MenuItem>
                  {clientList.map((client) => (
                    <MenuItem key={client} value={client}>
                      {client}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Assignment Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="assignment-select-label">Select Assignment</InputLabel>
                <Select
                  labelId="assignment-select-label"
                  id="assignment-select"
                  value={selectedAssignment}
                  label="Select Assignment"
                  onChange={handleAssignmentChange}
                  endAdornment={
                    selectedAssignment && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={clearAssignmentFilter}
                          edge="end"
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="">All Assignments</MenuItem>
                  {assignmentList.map((assignment) => (
                    <MenuItem key={assignment} value={assignment}>
                      {assignment}
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
            Loading data...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {filteredData.length > 0 ? (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: 3, mb: 4 }}>
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
                      <TableCell sx={{ fontWeight: "bold" }}>Cost (₹)</TableCell>
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
                          {work.Completion !== null && work.Completion !== undefined ? (
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
                          ₹{calculateIndividualCost(work.Name, work.Hours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Cost Summary Card */}
              <Card sx={{ mb: 4, boxShadow: 3 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" component="h2" fontWeight="medium">
                      Total Cost Summary
                    </Typography>
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={`₹ ${totalCost.toFixed(2)}`}
                      color="primary"
                      sx={{ fontWeight: "bold", fontSize: "1.1rem", py: 2.5, px: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </>
          ) : (
            <Paper sx={{ p: 6, textAlign: "center", backgroundColor: "grey.50" }}>
              <Typography variant="h6" color="text.secondary">
                {getNoDataMessage()}
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default ClientAssignmentSummary;