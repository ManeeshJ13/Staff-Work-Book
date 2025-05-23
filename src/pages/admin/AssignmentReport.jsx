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
import { addDays, subDays, format, startOfDay, isSameDay } from 'date-fns';
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
  const [startDate, setStartDate] = useState(new Date()); // Today
  const [endDate, setEndDate] = useState(subDays(new Date(), 6)); // 1 week ago (7 days total including today)
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

  // Generate array of dates between start and end in reverse order (today first)
  const memoizedDateRange = useMemo(() => {
    const dates = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);
    
    // Generate dates from start to end
    while (currentDate >= end) {
      dates.push(currentDate);
      currentDate = subDays(currentDate, 1);
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
        setError(null);
        
        // Use endDate as the earlier date and startDate as the later date for the query
        const { data: periodWorkData, error: workError } = await supabase
          .from("Staff Work")
          .select("*")
          .gte("Date", formatQueryDate(endDate))
          .lte("Date", formatQueryDate(startDate));
        
        if (workError) throw workError;
        
        const periodStaffNames = [...new Set(periodWorkData
          .filter(record => record.Name)
          .map(record => record.Name))];
        
        const { data: allStaffData, error: staffError } = await supabase
          .from("Staff Work")
          .select("Name")
          .order("Name")
          .not("Name", "is", null);
        
        if (staffError) throw staffError;
        
        const allStaffNames = [...new Set([
          ...periodStaffNames,
          ...allStaffData.map(item => item.Name)
        ])];
        
        const staffList = allStaffNames.map(name => ({
          name,
          workData: {}
        }));
        
        const summary = {};
        allStaffNames.forEach(name => {
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
        
        periodWorkData.forEach(record => {
          const { Name, Date, Hours, Presence } = record;
          
          if (!Name || !Date || !summary[Name]) {
            console.warn("Skipping invalid record:", record);
            return;
          }
          
          if (!summary[Name][Date]) {
            summary[Name][Date] = {
              totalHours: 0,
              onLeave: false,
              records: []
            };
          }
          
          summary[Name][Date].records.push(record);
          
          if (Presence === false) {
            summary[Name][Date].onLeave = true;
          }
          
          if (Hours) {
            summary[Name][Date].totalHours = Math.round((summary[Name][Date].totalHours + Hours) * 10) / 10;
          }
        });
        
        setStaffData(staffList);
        setSummaryData(summary);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load staff work data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, startDate, endDate]);

  const handleStartDateChange = (newDate) => {
    if (newDate) {
      setStartDate(newDate);
      // Ensure endDate is always 6 days before startDate
      setEndDate(subDays(newDate, 6));
    }
  };

  const handleEndDateChange = (newDate) => {
    if (newDate) {
      setEndDate(newDate);
      // Ensure startDate is always 6 days after endDate
      setStartDate(addDays(newDate, 6));
    }
  };

  const handlePreviousPeriod = () => {
    // Move 7 days back
    setStartDate(subDays(startDate, 7));
    setEndDate(subDays(endDate, 7));
  };

  const handleNextPeriod = () => {
    // Move 7 days forward
    setStartDate(addDays(startDate, 7));
    setEndDate(addDays(endDate, 7));
  };

  const handleToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(subDays(today, 6));
  };

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
                      p: 0.5,
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
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: '1200px', mx: 'auto' }}>
        {/* Header with responsive layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            component="h1" 
            fontWeight="bold"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            DAILY ATTENDANCE SUMMARY
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/admindash"
            startIcon={isMobile ? <HomeIcon /> : null}
            size={isMobile ? "small" : "medium"}
          >
            {isMobile ? "Home" : "Back to Dashboard"}
          </Button>
        </Box>

        {/* Date Range Selection - more compact */}
        <Paper elevation={2} sx={{ mb: 2, p: { xs: 1, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            mb: 1
          }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Select Period
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
              <Tooltip title="Previous Period">
                <IconButton onClick={handlePreviousPeriod} color="primary" size="small">
                  <NavigateBeforeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Today">
                <IconButton onClick={handleToday} color="primary" size="small">
                  <TodayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next Period">
                <IconButton onClick={handleNextPeriod} color="primary" size="small">
                  <NavigateNextIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: '100%'
            }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                sx={{ width: { xs: '100%', sm: '50%' } }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    size: 'small'
                  } 
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                sx={{ width: { xs: '100%', sm: '50%' } }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    size: 'small'
                  } 
                }}
              />
            </Box>
          </LocalizationProvider>
          
          {/* Period display */}
          <Box sx={{ 
            mt: 1,
            p: 1,
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography variant="body2" fontWeight="medium">
              {formatDisplayDate(endDate)} to {formatDisplayDate(startDate)}
            </Typography>
          </Box>
        </Paper>

        {/* Legend - made more compact */}
        <Box sx={{ 
          mb: 2,
          display: 'flex', 
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(25, 118, 210, 0.15)', border: '1px solid #1976d2' }}></Box>
            <Typography variant="caption" color="black">Leave</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: 'rgba(255, 235, 59, 0.3)', border: '1px solid #f57c00' }}></Box>
            <Typography variant="caption" color="black">Less than 5 hours</Typography>
          </Box>
        </Box>
 
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Loading work data...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : staffData.length > 0 ? (
          <>
            {/* Mobile view */}
            {isMobile && (
              <Box sx={{ mt: 1 }}>
                {Object.keys(summaryData).sort().map((staffName, index) => (
                  <StaffMobileCard key={index} staffName={staffName} />
                ))}
              </Box>
            )}
            
            {/* Desktop view - removed scrollable container */}
            {!isMobile && (
              <TableContainer component={Paper} elevation={2} sx={{ 
                overflowX: 'auto',
                '& .MuiTableCell-root': {
                  py: 0.5,
                  px: 1,
                }
              }}>
                <Table 
                  aria-label="staff work hours table" 
                  size="small"
                  sx={{
                    '& .MuiTableCell-head': {
                      py: 1,
                    }
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold',
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'grey.100',
                          zIndex: 1,
                          minWidth: '120px',
                          py: 1
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
                              minWidth: '70px',
                              ...(isToday && { 
                                borderBottom: `2px solid ${theme.palette.primary.main}`,
                                color: theme.palette.primary.main
                              })
                            }}
                          >
                            <Typography variant="caption" fontWeight="inherit">
                              {formatDisplayDate(date)}
                            </Typography>
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
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          height: '40px'
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            fontWeight: 'medium',
                            position: 'sticky',
                            left: 0,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                            boxShadow: '2px 0px 3px rgba(0,0,0,0.05)',
                            py: 1
                          }}
                        >
                          <Typography variant="body2" noWrap>
                            {staffName}
                          </Typography>
                        </TableCell>
                        {dateRange.map((date, dateIndex) => {
                          const cellData = renderCell(staffName, date);
                          return (
                            <TableCell 
                              key={dateIndex} 
                              align="center"
                              sx={{
                                ...cellData.style,
                                py: 0.5
                              }}
                            >
                              <Typography variant="body2">
                                {cellData.content}
                              </Typography>
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
              p: { xs: 2, sm: 3 },
              textAlign: 'center',
              bgcolor: 'grey.50'
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No Staff Data Available
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default withAuth(AssignmentReport);