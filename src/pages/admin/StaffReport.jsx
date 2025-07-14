import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import withAuth from "../../components/withAuth";
import * as XLSX from 'xlsx';
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
  const [clientsData, setClientsData] = useState([]); // Store full clients data for group lookup
  const [groupList, setGroupList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);
  const [financialYearList, setFinancialYearList] = useState([]);
  const [staffHourlyRates, setStaffHourlyRates] = useState([]);
  
  // Filter selections
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
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
          fetchClientList() // Need this for group information
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

  // Fetch staff work data and extract unique dropdown values
  const fetchStaffWorkData = async () => {
    try {
      //fetching alll the data using pagination
      let allData = [];
      let from = 0;
      let limit = 1000;
      let hasMore = true;

      while (hasMore) {
  const { data, error } = await supabase
    .from("Staff Work")
    .select("*")
    .order("Date", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;

  if (data && data.length > 0) {
    allData = [...allData, ...data];
    from += limit;
    hasMore = data.length === limit;
  } else {
    hasMore = false;
  }
}

      //filter out Data when absent
      const filteredByPresence = allData ? allData.filter (work => work.Presence !== false) : [];
      setStaffWorkData(filteredByPresence);
      setFilteredData(filteredByPresence);
    
      // Extract unique values for dropdown lists from Staff Work table
      const uniqueStaff = [...new Set(filteredByPresence.map(item => item.Name).filter(Boolean))];
      const uniqueAssignments = [...new Set(filteredByPresence.map(item => item.Assignment).filter(Boolean))];
      const uniqueFinancialYears = [...new Set(
        filteredByPresence
        .map(item => item.Financial_Year)
        .filter(year => year && financialYears.includes(year))
      )];

      // Sort lists alphabetically
      setStaffList(uniqueStaff.sort());
      setAssignmentList(uniqueAssignments.sort());
      setFinancialYearList(uniqueFinancialYears.sort());

      // Fetch hourly rates for the unique staff found
      await fetchStaffHourlyRates(uniqueStaff);
    
      // Calculate total hours
      let hoursSum = 0;
      filteredByPresence.forEach(work => {
        if (work.Hours && !isNaN(parseFloat(work.Hours))) {
          hoursSum += parseFloat(work.Hours);
        }
      });
      setTotalHours(hoursSum);
    } catch (err) {
      console.error("Error fetching staff work data:", err);
      throw err;
    }
    };


  // Fetch hourly rates for the staff found in Staff Work table
  const fetchStaffHourlyRates = async (staffNames) => {
    try {
      if (!staffNames || staffNames.length === 0) {
        setStaffHourlyRates([]);
        return;
      }

      const { data: staffListData, error: staffListError } = await supabase
        .from("Staff List")
        .select('Staff_Name, hourly_rate')
        .in('Staff_Name', staffNames)
        .not('Staff_Name', 'is', null);

      if (staffListError) throw staffListError;

      setStaffHourlyRates(staffListData || []);
    } catch (err) {
      console.error("Error fetching staff hourly rates:", err);
      // Don't throw error here as this is not critical for the main functionality
      setStaffHourlyRates([]);
    }
  };

  // Fetch client list to get group information
  const fetchClientList = async () => {
    try {
      const { data, error } = await supabase
        .from("Clients List")
        .select("*");
      
      if (error) throw error;
      
      // Store full clients data for group lookup
      setClientsData(data || []);

      //Extract unique clients list from Clients List table
      const uniqueClientsFromTable = [...new Set(
        data
        .map(client => client.Client_Name)
        .filter(name => name && name.trim()!=='')
      )];

      //sorting clients alphabetically
      uniqueClientsFromTable.sort((a,b) => a.localeCompare(b));
      setClientList(uniqueClientsFromTable);
      
      // Extract unique groups directly from Group column in Clients List table
      const uniqueGroups = [...new Set(
        data
          .map(client => client.Group)
          .filter(group => group && group.trim() !== '')
      )];
      
      // Sort groups alphabetically
      uniqueGroups.sort((a, b) => a.localeCompare(b));
      
      setGroupList(uniqueGroups);
    } catch (err) {
      console.error("Error fetching client list:", err);
      throw err;
    }
  };

  // Get group for a client from the clients data
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
      if (!isNaN(cost) && cost>0) {
        costSum += cost;
      }
      
      // Calculate hours
      if (work.Hours && !isNaN(parseFloat(work.Hours))) {
        hoursSum += parseFloat(work.Hours);
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


  // Helper functions
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const calculateTotalCostValue = (staffName, hours) => {
    if (!staffName || !hours) return NaN;
    
    const staffRate = staffHourlyRates.find(staff => staff.Staff_Name === staffName);
    console.log('Staff:', staffName, 'Rate:', staffRate, 'Hours:', hours); 

    
    if (!staffRate || !staffRate.hourly_rate) return NaN;

    const cost=parseFloat(staffRate.hourly_rate) * parseFloat(hours);
    console.log('Calculated Cose:', cost) 
    return cost;
  };

  const calculateTotalCost = (staffName, hours) => {
    const cost = calculateTotalCostValue(staffName, hours);
    return isNaN(cost) ? "N/A" : cost.toFixed(2);
  };

  //download into excel
  const exportToExcel = () =>{
    //Preparing data for Excel
    const excelData=filteredData.map(row => ({
      'Name':row.Name || "N/A",
      'Date': formatDate(row.Date),
      'Presence': row.Presence === true ? "Yes" : "No",
      'Client': row.Client || "N/A",
      'Group': getClientGroup(row.Client),
      'Assignment': row.Assignment || "N/A",
      'Work Done' : row.Work_Done || "N/A",
      'Financial Year': row.Financial_Year || "N/A",
      'Hours': row.Hours || "N/A",
      'Total Cost': calculateTotalCost(row.Name, row.Hours)
    }));

    //summary row
    const summaryRow={
      'Name':'',
      'Date':'',
      'Presence':'',
      'Client':'',
      'Group':'',
      'Assignment':'',
      'Work Done':'',
      'Financial Year':'',
      'Hours':totalHours.toFixed(2),
      'Total Cost':`₹${totalCost.toFixed(2)}`
    };

    excelData.push(summaryRow);

    //create workbook and worksheet
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.json_to_sheet(excelData);

    //setting column widths
    const columnWidths=[
      {wch:15}, //Name
      {wch:12}, //Date
      {wch:10}, //Presence
      {wch:20}, //Client
      {wch:15}, //Group
      {wch:20}, //Assignment
      {wch:40}, //Work Done
      {wch:15}, //Financial Year
      {wch:10}, //Hours
      {wch:12}, //Total Cost
    ];
    ws['!cols'] = columnWidths;

    //Adding worksheet to the workbook
    XLSX.utils.book_append_sheet(wb,ws,'Staff Report');

    //Generating filename using current date
    const filename = `staff_report_${new Date().toISOString().slice(0,10)}.xlsx`;

    //save file
    XLSX.writeFile(wb,filename);
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
      renderOption={(props, option) => (
        <Box 
          component="li" 
          {...props}
          sx={{
            textAlign: 'left !important',
            justifyContent: 'flex-start !important',
            alignItems: 'flex-start !important',
            display: 'flex !important',
            width: '100%'
          }}
        >
          {option}
        </Box>
      )}
      disableCloseOnSelect
      limitTags={2}
      sx={{ 
        minWidth: "300px", 
        width: "100%",
        '& .MuiAutocomplete-option': {
          textAlign: 'left !important',
          justifyContent: 'flex-start !important',
          alignItems: 'flex-start !important'
        }
      }}
      listboxProps={{ 
        style: { 
          maxHeight: '250px'
        },
        sx: {
          '& .MuiAutocomplete-option': {
            textAlign: 'left !important',
            justifyContent: 'flex-start !important',
            display: 'flex !important',
            alignItems: 'flex-start !important'
          }
        }
      }}
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
              <Tooltip title="Export to Excel">
                <IconButton 
                  color="primary" 
                  onClick={exportToExcel}
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
            <TableCell sx={{maxWidth:'150px', whiteSpace:'normal', wordBreak:'break-word' }}>
              <Tooltip title={work.Assignment || "N/A"}>
                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {work.Assignment || "N/A"}
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell sx={{minWidth:'250px',maxWidth:'100%',whiteSpace:'normal',wordBreak:'break-word'}}>
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
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
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