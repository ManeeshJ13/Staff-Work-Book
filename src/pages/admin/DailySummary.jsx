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
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const DailySummary = () => {
  const [staffWorkData, setStaffWorkData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateList, setDateList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
            <Typography variant="h6" component="div" gutterBottom>
              {work.Name || "N/A"}
            </Typography>
            
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
          <TableContainer component={Paper} elevation={2} sx={{ width: '102%', overflowX: 'auto', }}>
            <Table aria-label="staff work table" size="small" sx={{ minWidth: 650}}>
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
                    <TableCell sx={{ width: '30%', minWidth: 300, wordWrap: 'break-word', whiteSpace: 'normal' }}>
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
    </Box>
  );
};

export default withAuth(DailySummary);