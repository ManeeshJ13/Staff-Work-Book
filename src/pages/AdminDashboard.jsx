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
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  SwipeableDrawer
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Dashboard,
  People,
  PersonAdd,
  CalendarToday,
  Assignment,
  ArrowBack,
  Assessment,
  Close as CloseIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const [isHome, setIsHome] = useState(true);

  // Check if we're on the home page
  useEffect(() => {
    setIsHome(location.pathname === '/admindash' || location.pathname === '/admin');
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
    { text: 'Client Management', icon: <PersonAdd />, path: '/admin/ClientManagement' },
    { text: 'Staff Management', icon: <PersonAdd />, path: '/admin/StaffManagement' },
    { text: 'Add New Assignment', icon: <Assignment />, path: '/admin/AddAssignment' }
  ];

  const drawer = (
    <Box sx={{ width: { xs: '100vw', sm: 280 }, height: '100%' }} role="presentation">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Admin Controls
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={toggleDrawer(false)}
            sx={{ display: { sm: 'none' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
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
        <Box sx={{ flexGrow: 1 }} />
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isHome ? 'Admin Dashboard' : 
              adminMenuItems.find(item => item.path === location.pathname)?.text || 'Admin Dashboard'}
          </Typography>
          {!isHome && (
            <Button
              color="inherit"
              component={Link}
              to="/admindash"
              startIcon={<HomeIcon />}
              sx={{ mr: 1, display: { xs: 'none', sm: 'flex' } }}
            >
              Home
            </Button>
          )}
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box component="nav">
        <SwipeableDrawer
          anchor={isMobile ? 'bottom' : 'left'}
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          disableSwipeToOpen={false}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile
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
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
        <Toolbar /> {/* This creates space below the AppBar */}
        
        {isHome ? (
          <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2, md: 4 }, mb: { xs: 2, sm: 3, md: 4 } }}>
            {/* All 6 cards in one row with scrolling for smaller screens */}
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'row',
                flexWrap: { xs: 'nowrap', md: 'wrap' },
                gap: { xs: 1, sm: 2 },
                overflow: { xs: 'auto', md: 'visible' },
                pb: { xs: 2, md: 0 }, // Add padding for scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.primary.main} transparent`,
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '10px',
                },
                msOverflowStyle: 'none',  // IE and Edge
                scrollSnapType: 'x mandatory',
              }}
            >
              {adminMenuItems.map((item, index) => (
                <Box 
                  key={item.text}
                  sx={{ 
                    flex: { xs: '0 0 85%', sm: '0 0 40%', md: '1 1 calc(16.666% - 16px)' },
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Card 
                    component={Link} 
                    to={item.path}
                    sx={{ 
                      height: '100%',
                      minHeight: { xs: 100, sm: 120, md: 140 },
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
                          fontSize: { xs: 28, sm: 32, md: 40 }, 
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
                          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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
                </Box>
              ))}
            </Box>
    
            {/* Pagination dots for mobile */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 1,
                gap: 0.5
              }}>
                {adminMenuItems.map((_, index) => (
                  <Box 
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      opacity: 0.6,
                    }}
                  />
                ))}
              </Box>
            )}
    
            {/* Additional dashboard content would go here */}
          </Container>
        ) : (
          <Outlet />
        )}
      </Box>
    </Box>
  );
};

export default AdminLayout;