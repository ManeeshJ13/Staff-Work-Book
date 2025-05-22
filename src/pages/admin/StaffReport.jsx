import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import withAuth from "../../components/withAuth";
import { financialYears } from "../../lib/dataLists";
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
  FormControl,
  CircularProgress,
  Alert,
  Chip,
  Autocomplete,
  Grid,
  IconButton,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  Drawer,
  AppBar,
  Toolbar
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { useTheme } from "@mui/material/styles";

function AdminPage(){
    return <div>Admin-Only Content</div>;
}

const StaffReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // State for raw data
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filter options
  const [staffList, setStaffList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [clientsData, setClientsData] = useState([]); // Store full clients data
  const [groupList, setGroupList] = useState([]); // Added groups list
  const [assignmentList, setAssignmentList] = useState([]);
  const [financialYearList, setFinancialYearList] = useState([]);
  const [staffHourlyRates, setStaffHourlyRates] = useState([]);
  
  // Filter selections
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]); // Added selected groups
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [selectedFinancialYears, setSelectedFinancialYears] = useState([]);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  // Drawer control (replacing dialog for mobile)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Total cost
  const [totalCost, setTotalCost] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStaffWorkData(),
          fetchStaffList(),
          fetchClientList()
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Fetch staff work data
  const fetchStaffWorkData = async () => {
    try {
      const { data, error } = await supabase
        .from("Staff Work")
        .select("*")
        .order("Date", { ascending: false });

      if (error) throw error;
      
      // Filter out data where Presence is false
      const filteredByPresence = data ? data.filter(work => work.Presence !== false) : [];
      
      setStaffWorkData(filteredByPresence);
      setFilteredData(filteredByPresence);
      
      // Extract unique assignments and financial years from data
      const uniqueAssignments = [...new Set(filteredByPresence.map(item => item.Assignment).filter(Boolean))];
      const uniqueFinancialYears = [...new Set(
        filteredByPresence
        .map(item => item.Financial_Year)
        .filter(year => financialYears.includes(year))
        )];

      setAssignmentList(uniqueAssignments.sort());
      setFinancialYearList(uniqueFinancialYears.sort());
      
      // Calculate total hours
      let hoursSum = 0;
      filteredByPresence.forEach(work => {
        if (work.Hours && !isNaN(work.Hours)) {
          hoursSum += work.Hours;
        }
      });
      setTotalHours(hoursSum);
    } catch (err) {
      console.error("Error fetching staff work data:", err);
      throw err;
    }
  };

  // Fetch staff list and hourly rates
  const fetchStaffList = async () => {
    try {
      const { data, error } = await supabase
        .from("Staff List")
        .select("*");
      
      if (error) throw error;
      
      const staffNames = data.map(item => item.Staff_Name).filter(Boolean);
      staffNames.sort((a, b) => a && b ? a.localeCompare(b) : 0);
      
      setStaffList(staffNames);
      setStaffHourlyRates(data || []);
    } catch (err) {
      console.error("Error fetching staff list:", err);
      throw err;
    }
  };

  // Fetch client list
  const fetchClientList = async () => {
    try {
      const { data, error } = await supabase
        .from("Clients List")
        .select("*");
      
      if (error) throw error;
      
      // Store full clients data for group lookup
      setClientsData(data || []);
      
      const clients = data.map(item => item.Client_Name).filter(Boolean);
      clients.sort((a, b) => a && b ? a.localeCompare(b) : 0);
      
      setClientList(clients);
      
      // Extract unique groups from clients data
      const uniqueGroups = [...new Set(data.map(item => item.Group).filter(Boolean))];
      uniqueGroups.sort((a, b) => a && b ? a.localeCompare(b) : 0);
      
      setGroupList(uniqueGroups);
    } catch (err) {
      console.error("Error fetching client list:", err);
      throw err;
    }
  };

  // Get group for a client
  const getClientGroup = (clientName) => {
    if (!clientName) return "N/A";
    const client = clientsData.find(client => client.Client_Name === clientName);
    return client && client.Group ? client.Group : "N/A";
  };

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [
    selectedStaff, 
    selectedClients, 
    selectedGroups,
    selectedAssignments, 
    selectedFinancialYears, 
    dateFrom, 
    dateTo, 
    staffWorkData,
    clientsData // Add clientsData to dependency array
  ]);

  // Filter data based on all selected filters
  const applyFilters = () => {
    let filtered = [...staffWorkData];
    
    // Filter by staff names
    if (selectedStaff.length > 0) {
      filtered = filtered.filter(work => selectedStaff.includes(work.Name));
    }
    
    // Filter by clients
    if (selectedClients.length > 0) {
      filtered = filtered.filter(work => selectedClients.includes(work.Client));
    }
    
    // Filter by groups
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(work => {
        const clientGroup = getClientGroup(work.Client);
        return selectedGroups.includes(clientGroup);
      });
    }
    
    // Filter by assignments
    if (selectedAssignments.length > 0) {
      filtered = filtered.filter(work => selectedAssignments.includes(work.Assignment));
    }
    
    // Filter by financial years
    if (selectedFinancialYears.length > 0) {
      filtered = filtered.filter(work => selectedFinancialYears.includes(work.Financial_Year));
    }
    
    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(work => {
        if (!work.Date) return false;
        const workDate = new Date(work.Date);
        return workDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(work => {
        if (!work.Date) return false;
        const workDate = new Date(work.Date);
        return workDate <= toDate;
      });
    }
    
    setFilteredData(filtered);
    
    // Calculate total cost and hours
    let costSum = 0;
    let hoursSum = 0;
    
    filtered.forEach(work => {
      // Calculate cost
      const cost = calculateTotalCostValue(work.Name, work.Hours);
      if (!isNaN(cost)) {
        costSum += cost;
      }
      
      // Calculate hours
      if (work.Hours && !isNaN(work.Hours)) {
        hoursSum += work.Hours;
      }
    });
    
    setTotalCost(costSum);
    setTotalHours(hoursSum);
  };

  // Handle filter clearing
  const clearAllFilters = () => {
    setSelectedStaff([]);
    setSelectedClients([]);
    setSelectedGroups([]);
    setSelectedAssignments([]);
    setSelectedFinancialYears([]);
    setDateFrom(null);
    setDateTo(null);
    setFilterDrawerOpen(false);
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
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

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "Name", "Date", "Presence", "Client", "Group", "Assignment", "Work Done", 
      "Financial Year", "Hours", "Completion", "Total Cost"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.Name || "N/A",
        formatDate(row.Date),
        row.Presence === true ? "Yes" : "No",
        row.Client || "N/A",
        getClientGroup(row.Client),
        row.Assignment || "N/A",
        `"${(row.Work_Done || "N/A").replace(/"/g, '""')}"`, // Escape quotes in text fields
        row.Financial_Year || "N/A",
        row.Hours || "N/A",
        row.Completion === true ? "Yes" : "No",
        calculateTotalCost(row.Name, row.Hours)
      ].join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter component with wider dropdowns for PC optimization
  const FiltersComponent = () => (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        {/* Date Range Filters */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={dateFrom}
              onChange={setDateFrom}
              maxDate={dateTo}
              inputFormat="MM/dd/yyyy"
              slotProps={{
                textField: { fullWidth: true, size: "small" }
              }}
              sx={{ width: "100%" }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="To Date"
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom}
              inputFormat="MM/dd/yyyy"
              slotProps={{
                textField: { fullWidth: true, size: "small" }
              }}
              sx={{ width: "100%" }}
            />
          </LocalizationProvider>
        </Grid>
        
        {/* Staff Selection - Wider dropdown */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth>
            <Autocomplete
              size="small"
              multiple
              fullWidth
              value={selectedStaff}
              onChange={(event, newValue) => setSelectedStaff(newValue)}
              options={staffList}
              renderInput={(params) => <TextField {...params} label="Staff" />}
              disableCloseOnSelect
              limitTags={2}
              sx={{ minWidth: "300px", width: "100%" }}
              listboxProps={{ style: { maxHeight: '250px' } }}
            />
          </FormControl>
        </Grid>
        
        {/* Client Selection - Wider dropdown */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth>
            <Autocomplete
              size="small"
              multiple
              fullWidth
              value={selectedClients}
              onChange={(event, newValue) => setSelectedClients(newValue)}
              options={clientList}
              renderInput={(params) => <TextField {...params} label="Clients" />}
              disableCloseOnSelect
              limitTags={2}
              sx={{ minWidth: "300px", width: "100%" }}
              listboxProps={{ style: { maxHeight: '250px' } }}
            />
          </FormControl>
        </Grid>
        
        {/* Group Selection - Wider dropdown */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth>
            <Autocomplete
              size="small"
              multiple
              fullWidth
              value={selectedGroups}
              onChange={(event, newValue) => setSelectedGroups(newValue)}
              options={groupList}
              renderInput={(params) => <TextField {...params} label="Groups" />}
              disableCloseOnSelect
              limitTags={2}
              sx={{ minWidth: "300px", width: "100%" }}
              listboxProps={{ style: { maxHeight: '250px' } }}
            />
          </FormControl>
        </Grid>
        
        {/* Assignment Selection - Wider dropdown */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth>
            <Autocomplete
              size="small"
              multiple
              fullWidth
              value={selectedAssignments}
              onChange={(event, newValue) => setSelectedAssignments(newValue)}
              options={assignmentList}
              renderInput={(params) => <TextField {...params} label="Assignments" />}
              disableCloseOnSelect
              limitTags={2}
              sx={{ minWidth: "300px", width: "100%" }}
              listboxProps={{ style: { maxHeight: '250px' } }}
            />
          </FormControl>
        </Grid>
        
        {/* Financial Year Selection - Wider dropdown */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormControl fullWidth>
            <Autocomplete
              size="small"
              multiple
              fullWidth
              value={selectedFinancialYears}
              onChange={(event, newValue) => setSelectedFinancialYears(newValue)}
              options={financialYearList}
              renderInput={(params) => <TextField {...params} label="Financial Years" />}
              disableCloseOnSelect
              limitTags={2}
              sx={{ minWidth: "300px", width: "100%" }}
              listboxProps={{ style: { maxHeight: '250px' } }}
            />
          </FormControl>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={clearAllFilters}
          startIcon={<ClearIcon />}
        >
          Clear All Filters
        </Button>
      </Box>
    </Box>
  );

 return (
  <Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
    <Box sx={{ p: 3, maxWidth: "1400px", mx: "auto" }}>
      {/* Header with title and home button */}
      <AppBar position="static" color="default" elevation={0} sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h5" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
            TIME AND COST REPORT
          </Typography>
          <Button 
            component={Link} 
            to="/admindash" 
            variant="contained" 
            color="primary"
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>

      {/* Filter section */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <FiltersComponent />
        </LocalizationProvider>
      </Paper>

      {/* Active filters display */}
      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ mr: 1 }}>Active Filters:</Typography>
        
        {selectedStaff.length === 0 && 
         selectedClients.length === 0 && 
         selectedGroups.length === 0 &&
         selectedAssignments.length === 0 && 
         selectedFinancialYears.length === 0 && 
         !dateFrom && 
         !dateTo ? (
          <Typography variant="body2" color="text.secondary">None</Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {dateFrom && (
              <Chip 
                label={`From: ${dateFrom.toLocaleDateString()}`} 
                size="small" 
                onDelete={() => setDateFrom(null)} 
              />
            )}
            
            {dateTo && (
              <Chip 
                label={`To: ${dateTo.toLocaleDateString()}`} 
                size="small" 
                onDelete={() => setDateTo(null)} 
              />
            )}
            
            {selectedStaff.map(staff => (
              <Chip 
                key={`staff-${staff}`}
                label={`Staff: ${staff}`} 
                size="small" 
                onDelete={() => setSelectedStaff(prev => prev.filter(s => s !== staff))} 
              />
            ))}
            
            {selectedClients.map(client => (
              <Chip 
                key={`client-${client}`}
                label={`Client: ${client}`} 
                size="small" 
                onDelete={() => setSelectedClients(prev => prev.filter(c => c !== client))} 
              />
            ))}
            
            {selectedGroups.map(group => (
              <Chip 
                key={`group-${group}`}
                label={`Group: ${group}`} 
                size="small" 
                onDelete={() => setSelectedGroups(prev => prev.filter(g => g !== group))} 
              />
            ))}
            
            {selectedAssignments.map(assignment => (
              <Chip 
                key={`assignment-${assignment}`}
                label={`Assignment: ${assignment}`} 
                size="small" 
                onDelete={() => setSelectedAssignments(prev => prev.filter(a => a !== assignment))} 
              />
            ))}
            
            {selectedFinancialYears.map(year => (
              <Chip 
                key={`year-${year}`}
                label={`FY: ${year}`} 
                size="small" 
                onDelete={() => setSelectedFinancialYears(prev => prev.filter(y => y !== year))} 
              />
            ))}
            
            <IconButton size="small" onClick={clearAllFilters} title="Clear all filters">
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Summary Cards showing total cost and hours */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card raised sx={{ bgcolor: "primary.light", color: "white" }}>
            <CardContent>
              <Typography variant="body1">Total Cost: ₹{totalCost.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card raised sx={{ bgcolor: "primary.light", color: "white" }}>
            <CardContent>
              <Typography variant="body1">Total Hours: {totalHours.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body1">
                Showing {filteredData.length} entries
              </Typography>
              <Tooltip title="Export to CSV">
                <IconButton 
                  color="primary" 
                  onClick={exportToCSV}
                  disabled={filteredData.length === 0}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data table */}
      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading report data...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : filteredData.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, bgcolor: "background.paper", borderRadius: 1, border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="h6" color="text.secondary">No data available for the selected filters</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
        </Box>
      ) : (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <TableContainer 
            component={Paper} 
            elevation={2}
            sx={{ width: '100%' }}
          >
            <Table size="small" aria-label="staff report table" sx={{ minWidth: 900  }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "primary.light" }}>
                  <TableCell sx={{ fontWeight: "bold", color: "white", width:"150px",minWidth:"150px" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Group</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Assignment</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Work Done</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white",width:"80px",minWidth:"80px" }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Done</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "white" }}>Cost</TableCell>
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
                    <TableCell>{getClientGroup(work.Client)}</TableCell>
                    <TableCell>
                      <Tooltip title={work.Assignment || "N/A"}>
                        <span>{work.Assignment || "N/A"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={work.Work_Done || "N/A"}>
                        <span>{work.Work_Done || "N/A"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{work.Financial_Year || "N/A"}</TableCell>
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
                  <TableCell colSpan={8} align="right" sx={{ fontWeight: "bold" }}>
                    Totals:
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {totalHours.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    ₹{totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  </Box>
);
};

export default withAuth(StaffReport);