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
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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

  // Edit and Delete dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Edit form states
  const [editFormData, setEditFormData] = useState({
    Name: '',
    Date: null,
    Client: '',
    Assignment: '',
    Work_Done: '',
    Financial_Year: '',
    Hours: '',
    Presence: true
  });
  
  // Snackbar for success/error messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

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

  // Handle edit button click
  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      Name: record.Name || '',
      Date: record.Date ? new Date(record.Date) : null,
      Client: record.Client || '',
      Assignment: record.Assignment || '',
      Work_Done: record.Work_Done || '',
      Financial_Year: record.Financial_Year || '',
      Hours: record.Hours || '',
      Presence: record.Presence !== false
    });
    setEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!selectedRecord) return;

    // ADD THIS DEBUG LOG
  console.log('Selected Record:', selectedRecord);
  console.log('Record ID:', selectedRecord.No);
  
  // Check if ID exists
  if (!selectedRecord.No) {
    console.error('No ID found for selected record');
    setSnackbarMessage("Error: Record ID not found. Please refresh and try again.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
    return;
  }
    
    try {
      setUpdating(true);
      
      const updateData = {
        Name: editFormData.Name,
        Date: editFormData.Date ? editFormData.Date.toISOString().split('T')[0] : null,
        Client: editFormData.Client,
        Assignment: editFormData.Assignment,
        Work_Done: editFormData.Work_Done,
        Financial_Year: editFormData.Financial_Year,
        Hours: parseFloat(editFormData.Hours) || null,
        Presence: editFormData.Presence
      };

      // ADD THIS DEBUG LOG
      console.log('Update Data:', updateData);
      
      const { error } = await supabase
        .from("Staff Work")
        .update(updateData)
        .eq("No", selectedRecord.No)
        .select();
      
      if (error) throw error;
      
      // Refresh data
      await fetchStaffWorkData();
      
      setEditDialogOpen(false);
      setSnackbarMessage("Record updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error("Error updating record:", err);
      setSnackbarMessage("Failed to update record. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;
    
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from("Staff Work")
        .delete()
        .eq("No", selectedRecord.No);
      
      if (error) throw error;
      
      // Refresh data
      await fetchStaffWorkData();
      
      setDeleteDialogOpen(false);
      setSnackbarMessage("Record deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error("Error deleting record:", err);
      setSnackbarMessage("Failed to delete record. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDeleting(false);
    }
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
      "Financial Year", "Hours", "Total Cost"
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
        <Box sx={{ width: '100%', overflowX: 'hidden', ml: 1 }}>
  <TableContainer 
    component={Paper} 
    elevation={2}
    sx={{ width: '100%', overflowX: 'auto' }}
  >
    <Table size="small" aria-label="staff report table">
      <TableHead>
        <TableRow sx={{ backgroundColor: "primary.light" }}>
          {[
            { label: "Name" },
            { label: "Date" },
            { label: "Client" },
            { label: "Group" },
            { label: "Assignment" },
            { label: "Work Done" },
            { label: "Year" },
            { label: "Hours" },
            { label: "Cost" },
            { label: "Actions" }
          ].map((col, idx) => (
            <TableCell
              key={idx}
              sx={{
                fontWeight: "bold",
                color: "white",
                whiteSpace: col === "Work Done" ? 'normal' : 'nowrap',
                padding: '6px',
              }}
            >
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredData.map((work, index) => (
          <TableRow 
            key={work.id || index}
            hover
            sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
          >
            <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {work.Name || "N/A"}
            </TableCell>
            <TableCell>{formatDate(work.Date)}</TableCell>
            <TableCell>{work.Client || "N/A"}</TableCell>
            <TableCell>{getClientGroup(work.Client)}</TableCell>
            <TableCell>
              <Tooltip title={work.Assignment || "N/A"}>
                <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {work.Assignment || "N/A"}
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title={work.Work_Done || "N/A"}>
                <Box sx={{ 
                  whiteSpace: 'normal', 
                  wordBreak: 'break-word',
                  maxWidth: '300px'
                }}>
                  {work.Work_Done || "N/A"}
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell>{work.Financial_Year || "N/A"}</TableCell>
            <TableCell>{work.Hours || "N/A"}</TableCell>
            <TableCell>₹{calculateTotalCost(work.Name, work.Hours)}</TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Edit Record">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleEditClick(work)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow sx={{ backgroundColor: "grey.100" }}>
          <TableCell colSpan={7} align="right" sx={{ fontWeight: "bold" }}>
            Totals:
          </TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>
            {totalHours.toFixed(2)}
          </TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>
            ₹{totalCost.toFixed(2)}
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  </TableContainer>
</Box>

      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Staff Work Record</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  sx={{
                    width:'230px'
                  }}
                  value={editFormData.Name}
                  onChange={(event, newValue) => setEditFormData(prev => ({ ...prev, Name: newValue || '' }))}
                  options={staffList}
                  renderInput={(params) => <TextField {...params} label="Staff Name" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  sx={{width:'280px'}}
                  value={editFormData.Client}
                  onChange={(event, newValue) => setEditFormData(prev => ({ ...prev, Client: newValue || '' }))}
                  options={clientList}
                  renderInput={(params) => <TextField {...params} label="Client" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    sx={{width:'150px'}}
                    value={editFormData.Date}
                    onChange={(newValue) => setEditFormData(prev => ({ ...prev, Date: newValue }))}
                    slotProps={{
                      textField: { fullWidth: true }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  sx={{width:'230px'}}
                  value={editFormData.Assignment}
                  onChange={(event, newValue) => setEditFormData(prev => ({ ...prev, Assignment: newValue || '' }))}
                  options={assignmentList}
                  renderInput={(params) => <TextField {...params} label="Assignment" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  sx={{width:'70px'}}
                  type="number"
                  label="Hours"
                  value={editFormData.Hours}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, Hours: e.target.value }))}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  sx={{width:'150px'}}
                  value={editFormData.Financial_Year}
                  onChange={(event, newValue) => setEditFormData(prev => ({ ...prev, Financial_Year: newValue || '' }))}
                  options={financialYearList}
                  renderInput={(params) => <TextField {...params} label="Financial Year" />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  sx={{width:'330px'}}
                  multiline
                  rows={3}
                  label="Work Done"
                  value={editFormData.Work_Done}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, Work_Done: e.target.value }))}
                />
              </Grid>
              
              
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this staff work record? This action cannot be undone.
          </DialogContentText>
          {selectedRecord && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Staff:</strong> {selectedRecord.Name}</Typography>
              <Typography variant="body2"><strong>Date:</strong> {formatDate(selectedRecord.Date)}</Typography>
              <Typography variant="body2"><strong>Client:</strong> {selectedRecord.Client}</Typography>
              <Typography variant="body2"><strong>Hours:</strong> {selectedRecord.Hours}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  </Box>
);
};

export default withAuth(StaffReport);