import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Dashboard,
  People,
  PersonAdd,
  CalendarToday,
  Assignment,
  ArrowBack
} from '@mui/icons-material';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    navigate('/signin');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const adminMenuItems = [
    { text: 'Client Summary', icon: <Dashboard />, path: '/admin/ClientsSummary' },
    { text: 'Daily Summary', icon: <CalendarToday />, path: '/admin/DailySummary' },
    { text: 'Staff Summary', icon: <People />, path: '/admin/StaffSummary' },
    { text: 'Client Assignment', icon: <Assignment />, path: '/admin/ClientAssignment' },
    { text: 'Add New Client', icon: <PersonAdd />, path: '/admin/AddClientPage' },
    { text: 'Add New Staff', icon: <PersonAdd />, path: '/admin/AddStaff' }
  ];

  const drawer = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Admin Controls
          </Typography>
        </Box>
        <Divider />
        <List>
          {adminMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                onClick={() => setDrawerOpen(false)}
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
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<Logout />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={toggleDrawer}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box',
              width: 280 
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Toolbar /> {/* This creates space below the AppBar */}
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Dashboard Cards - Quick Access */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {adminMenuItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.text}>
                    <Card 
                      component={Link} 
                      to={item.path}
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
                        textDecoration: 'none',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        {React.cloneElement(item.icon, { 
                          sx: { fontSize: 36, color: 'primary.main', mb: 2 } 
                        })}
                        <Typography 
                          variant="h6" 
                          align="center" 
                          color="textPrimary"
                        >
                          {item.text}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Main Content */}
            <Grid item xs={12}>
              <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Outlet />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;