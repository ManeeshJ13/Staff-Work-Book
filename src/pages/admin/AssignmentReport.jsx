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
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format, startOfDay, isSameDay } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import HomeIcon from '@mui/icons-material/Home';

function AdminPage(){
    return <div>Admin-Only Content</div>;
}

const AssignmentReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [staffData, setStaffData] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), isMobile ? 2 : isTablet ? 4 : 6));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({});
  
  // Format date for display - shorter format for mobile
  const formatDisplayDate = (date) => {
    return isMobile ? format(date, 'MM/dd') : format(date, 'EEE, MMM d');
  };

  // Format date for Supabase query (YYYY-MM-DD)
  const formatQueryDate = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Generate array of dates between start and end - memoized to prevent unnecessary recalculations
  const memoizedDateRange = useMemo(() => {
    const dates = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  }, [startDate, endDate]);

  // Update dateRange when memoizedDateRange changes
  useEffect(() => {
    setDateRange(memoizedDateRange);
  }, [memoizedDateRange]);

  // Fetch staff list and work data with optimized data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (dateRange.length === 0) return;
      
      try {
        setLoading(true);
        
        // Use Promise.all to parallelize the API calls
        const [staffNamesResponse, workDataResponse] = await Promise.all([
          // Get unique staff names from the database
          supabase
            .from("Staff Work")
            .select("Name")
            .order("Name")
            .not("Name", "is", null),
          
          // Fetch all work data for the date range
          supabase
            .from("Staff Work")
            .select("*")
            .gte("Date", formatQueryDate(startDate))
            .lte("Date", formatQueryDate(endDate))
        ]);
        
        if (staffNamesResponse.error) throw staffNamesResponse.error;
        if (workDataResponse.error) throw workDataResponse.error;
        
        // Extract unique staff names
        const uniqueStaffNames = [...new Set(staffNamesResponse.data.map(item => item.Name))];
        const workData = workDataResponse.data;
        
        // Process and organize the data
        const staffList = uniqueStaffNames.map(name => ({
          name,
          workData: {}
        }));
        
        // Create a summary of work hours and presence by staff and date - optimize by reducing iterations
        const summary = {};
        
        // Initialize summary structure
        uniqueStaffNames.forEach(name => {
          summary[name] = {};
          
          dateRange.forEach(date => {
            const dateStr = formatQueryDate(date);
            summary[name][dateStr] = {
              totalHours: 0,
              onLeave: false,
              records: []
            };
          });
        });
        
        // Process work data more efficiently
        workData.forEach(record => {
          const { Name, Date, Hours, Presence } = record;
          
          if (Name && Date && summary[Name] && summary[Name][Date]) {
            summary[Name][Date].records.push(record);
            
            // If presence is false, mark as on leave
            if (Presence === false) {
              summary[Name][Date].onLeave = true;
            }
            
            // Add hours if available
            if (Hours) {
              summary[Name][Date].totalHours += Hours;
            }
          }
        });
        
        setStaffData(staffList);
        setSummaryData(summary);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load staff work data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleStartDateChange = (newDate) => {
    if (newDate) {
      setStartDate(newDate);
      // If the new start date is after the current end date, adjust the end date
      if (newDate > endDate) {
        setEndDate(addDays(newDate, isMobile ? 2 : isTablet ? 4 : 6));
      }
    }
  };

  const handleEndDateChange = (newDate) => {
    if (newDate) {
      // If the new end date is before the current start date, adjust the start date
      if (newDate < startDate) {
        setStartDate(newDate);
      }
      setEndDate(newDate);
    }
  };

  // Quick date navigation handlers
  const handlePreviousPeriod = () => {
    const daysDifference = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    setStartDate(addDays(startDate, -daysDifference - 1));
    setEndDate(addDays(endDate, -daysDifference - 1));
  };

  const handleNextPeriod = () => {
    const daysDifference = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    setStartDate(addDays(startDate, daysDifference + 1));
    setEndDate(addDays(endDate, daysDifference + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(addDays(today, isMobile ? 2 : isTablet ? 4 : 6));
  };

  // Render cell content and style based on data - memoized
  const renderCell = (staffName, date) => {
    const dateStr = formatQueryDate(date);
    const staffDayData = summaryData[staffName]?.[dateStr];
    
    if (!staffDayData) {
      return {
        content: "N/A",
        style: {}
      };
    }
    
    if (staffDayData.onLeave) {
      return {
        content: "Leave",
        style: { backgroundColor: 'rgba(25, 118, 210, 0.15)', color: '#1976d2', fontWeight: 'bold' }
      };
    }
    
    const hours = staffDayData.totalHours;
    
    if (hours === 0) {
      return {
        content: "-",
        style: {}
      };
    }
    
    if (hours < 5) {
      return {
        content: hours,
        style: { backgroundColor: 'rgba(255, 235, 59, 0.3)', color: '#f57c00' }
      };
    }
    
    return {
      content: hours,
      style: {}
    };
  };

  // Mobile view card component for each staff member
  const StaffMobileCard = ({ staffName }) => {
    return (
      <Card sx={{ mb: 2, overflow: 'visible' }}>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" component="h2" fontWeight="medium">
            {staffName}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={1}>
            {dateRange.map((date, idx) => {
              const cellData = renderCell(staffName, date);
              const isToday = isSameDay(date, new Date());
              
              return (
                <Grid item xs={4} key={idx}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      textAlign: 'center',
                      border: isToday ? `1px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                      borderRadius: 1,
                      ...cellData.style,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption" display="block" fontWeight={isToday ? 'bold' : 'normal'}>
                      {format(date, 'MM/dd')}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {cellData.content}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1200px', mx: 'auto' }}>
        {/* Header with responsive layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            fontWeight="bold"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            Staff Work Hours
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/admindash"
            startIcon={isMobile ? <HomeIcon /> : null}
            size={isMobile ? "medium" : "large"}
          >
            {isMobile ? "Home" : "Back to Dashboard"}
          </Button>
        </Box>

        {/* Date Range Selection - more touch-friendly for mobile */}
        <Paper elevation={2} sx={{ mb: 3, p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Typography variant="h6" fontWeight="medium">
              Select Period
            </Typography>
            
            {/* Quick navigation buttons */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
              <Tooltip title="Previous Period">
                <IconButton onClick={handlePreviousPeriod} color="primary" size={isMobile ? "small" : "medium"}>
                  <NavigateBeforeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Today">
                <IconButton onClick={handleToday} color="primary" size={isMobile ? "small" : "medium"}>
                  <TodayIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next Period">
                <IconButton onClick={handleNextPeriod} color="primary" size={isMobile ? "small" : "medium"}>
                  <NavigateNextIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              width: '100%'
            }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                sx={{ width: { xs: '100%', sm: '50%' } }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                sx={{ width: { xs: '100%', sm: '50%' } }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
          
          {/* Period display */}
          <Box sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
            </Typography>
          </Box>
        </Paper>

        {/* Legend */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(25, 118, 210, 0.15)', border: '1px solid #1976d2' }}></Box>
            <Typography variant="body2" color="black">Leave</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(255, 235, 59, 0.3)', border: '1px solid #f57c00' }}></Box>
            <Typography variant="body2" color="black">Less than 5 hours</Typography>
          </Box>
        </Box>
 
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
        ) : staffData.length > 0 ? (
          <>
            {/* Mobile view */}
            {isMobile && (
              <Box sx={{ mt: 2 }}>
                {Object.keys(summaryData).sort().map((staffName, index) => (
                  <StaffMobileCard key={index} staffName={staffName} />
                ))}
              </Box>
            )}
            
            {/* Desktop view */}
            {!isMobile && (
              <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
                <Table aria-label="staff work hours table" size={isTablet ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold',
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'grey.100',
                          zIndex: 1,
                          minWidth: '120px'
                        }}
                      >
                        Staff Name
                      </TableCell>
                      {dateRange.map((date, index) => {
                        const isToday = isSameDay(date, new Date());
                        return (
                          <TableCell 
                            key={index} 
                            sx={{ 
                              fontWeight: isToday ? 'bold' : 'medium', 
                              textAlign: 'center',
                              minWidth: '90px',
                              ...(isToday && { 
                                borderBottom: `2px solid ${theme.palette.primary.main}`,
                                color: theme.palette.primary.main
                              })
                            }}
                          >
                            {formatDisplayDate(date)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(summaryData).sort().map((staffName, index) => (
                      <TableRow 
                        key={index}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell 
                          sx={{ 
                            fontWeight: 'medium',
                            position: 'sticky',
                            left: 0,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                            boxShadow: '2px 0px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          {staffName}
                        </TableCell>
                        {dateRange.map((date, dateIndex) => {
                          const cellData = renderCell(staffName, date);
                          return (
                            <TableCell 
                              key={dateIndex} 
                              align="center"
                              sx={cellData.style}
                            >
                              {cellData.content}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <Paper 
            elevation={1} 
            sx={{ 
              p: { xs: 3, sm: 5 }, 
              textAlign: 'center',
              bgcolor: 'grey.50'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No Staff Data Available
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default withAuth(AssignmentReport);