import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Material-UI imports
import {
  AppBar,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Dashboard,
  People,
  PersonAdd,
  CalendarToday,
  Assignment,
  Assessment,
  Close as CloseIcon,
  Home as HomeIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [isHome, setIsHome] = useState(true);
  const [mobileNavValue, setMobileNavValue] = useState(0);

  // Check if we're on the home page
  useEffect(() => {
    const path = location.pathname;
    setIsHome(path === '/admindash' || path === '/admin');
    
    // Update mobile navigation value based on current path
    const menuIndex = adminMenuItems.findIndex(item => item.path === path);
    if (menuIndex >= 0 && menuIndex < 4) { // Only the first 4 items are in the bottom nav
      setMobileNavValue(menuIndex + 1); // +1 because 0 is home
    } else if (isHome) {
      setMobileNavValue(0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    navigate('/signin');
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const adminMenuItems = [
    { text: 'Staff Report', icon: <Assessment />, path: '/admin/StaffReport' },
    { text: 'Assignment Report', icon: <Assessment />, path: '/admin/AssignmentReport' },
    { text: 'Daily Summary', icon: <CalendarToday />, path: '/admin/DailySummary' },
    { text: 'Client Management', icon: <People />, path: '/admin/ClientManagement' },
    { text: 'Staff Management', icon: <PersonAdd />, path: '/admin/StaffManagement' },
    { text: 'Assignment Management', icon: <Assignment />, path: '/admin/AssignmentManagement' }
  ];

  const drawer = (
    <Box sx={{ width: { xs: '100vw', sm: 280 }, height: '100%' }} role="presentation">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Admin Controls
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={toggleDrawer(false)}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/admindash"
              onClick={toggleDrawer(false)}
              selected={isHome}
            >
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Dashboard Home" />
            </ListItemButton>
          </ListItem>
          {adminMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                onClick={toggleDrawer(false)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  // Only show bottom navigation on mobile
  const bottomNav = isMobile && (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1100,
        borderRadius: 0,
        boxShadow: 3
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={mobileNavValue}
        onChange={(event, newValue) => {
          setMobileNavValue(newValue);
          if (newValue === 0) {
            navigate('/admindash');
          } else if (newValue < 5) {
            navigate(adminMenuItems[newValue - 1].path);
          } else {
            setDrawerOpen(true);
          }
        }}
        showLabels
        sx={{ 
          height: 60
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        {adminMenuItems.slice(0, 3).map((item, idx) => (
          <BottomNavigationAction 
            key={idx}
            label={item.text.split(' ')[0]} // Just show first word
            icon={item.icon} 
          />
        ))}
        <BottomNavigationAction label="More" icon={<MoreIcon />} onClick={() => setDrawerOpen(true)} />
      </BottomNavigation>
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', pb: isMobile ? 7 : 0 }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                display: 'block',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { xs: '180px', sm: '320px', md: 'none' } 
              }}
            >
              {isHome ? 'Admin Dashboard' : 
                adminMenuItems.find(item => item.path === location.pathname)?.text || 'Admin Dashboard'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isHome && (
              <IconButton
                color="inherit"
                component={Link}
                to="/admindash"
                aria-label="home"
              >
                <HomeIcon />
              </IconButton>
            )}
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              aria-label="logout"
              edge="end"
            >
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <SwipeableDrawer
        anchor={isMobile ? 'bottom' : 'left'}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            width: { xs: '100%', sm: 280 },
            height: isMobile ? 'auto' : '100%',
            maxHeight: isMobile ? '80vh' : '100vh',
            borderTopLeftRadius: isMobile ? theme.spacing(2) : 0,
            borderTopRightRadius: isMobile ? theme.spacing(2) : 0
          },
        }}
      >
        {drawer}
      </SwipeableDrawer>
      
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        mt: { xs: 7, sm: 8 }, // Account for AppBar height
        mb: isMobile ? 8 : 0 // Account for bottom navigation
      }}>
        {isHome ? (
          <Container maxWidth="xl" sx={{ my: { xs: 1, sm: 2, md: 3 } }}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {adminMenuItems.map((item) => (
                <Grid item xs={6} sm={4} md={4} lg={2} key={item.text}>
                  <Card 
                    component={Link} 
                    to={item.path}
                    sx={{ 
                      height: '100%',
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: { xs: 1.5, sm: 2 },
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                      borderRadius: 2,
                      minHeight: { xs: 90, sm: 110, md: 130 },
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      textAlign: 'center'
                    }}>
                      {React.cloneElement(item.icon, { 
                        sx: { 
                          fontSize: { xs: 28, sm: 32, md: 36 }, 
                          color: 'primary.main', 
                          mb: { xs: 0.5, sm: 1 } 
                        } 
                      })}
                      <Typography 
                        variant="body1" 
                        align="center" 
                        color="textPrimary"
                        sx={{
                          mt: 0.5,
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                          WebkitLineClamp: 2,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.text}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Additional dashboard content would go here */}
          </Container>
        ) : (
          <Outlet />
        )}
      </Box>
      
      {/* Bottom Navigation for Mobile */}
      {bottomNav}
    </Box>
  );
};

export default AdminLayout;