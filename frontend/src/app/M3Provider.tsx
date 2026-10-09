"use client";

import React from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { usePathname, useRouter } from 'next/navigation';

const m3Theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#6750A4', // M3 Baseline Primary
      light: '#EADDFF', // Primary Container
      dark: '#21005D', // On Primary Container
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8', // Secondary Container
      dark: '#1D192B', // On Secondary Container
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
    },
    background: {
      default: '#FEF7FF', // M3 Surface
      paper: '#F3EDF7',   // M3 Surface Container Highest
    },
    text: {
      primary: '#1D1B20', // M3 On Surface
      secondary: '#49454F', // M3 On Surface Variant
    }
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.1px' },
    h1: { letterSpacing: '-0.2px' },
    h4: { fontWeight: 400 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 100,
          padding: '10px 24px',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#F3EDF7',
          boxShadow: 'none',
          border: '1px solid transparent',
        }
      }
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FEF7FF',
          color: '#1D1B20',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FEF7FF',
          borderRight: 'none',
        }
      }
    }
  }
});

const DRAWER_WIDTH = 280;

const ROUTES = [
  { text: 'Overview', path: '/', icon: <DashboardIcon /> },
  { text: 'Data Lab', path: '/data-lab', icon: <StorageIcon /> },
  { text: 'Active Mining', path: '/active-mining', icon: <TuneIcon /> },
  { text: 'HITL Studio', path: '/hitl-studio', icon: <EditIcon /> },
  { text: 'Benchmark', path: '/benchmark', icon: <AssessmentIcon /> },
];

export default function M3Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ThemeProvider theme={m3Theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              GreenSM Detection Lab
            </Typography>
            <IconButton color="inherit" sx={{ mr: 2 }}>
              <Badge badgeContent={3} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.875rem' }}>A</Avatar>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH, 
              boxSizing: 'border-box',
              pt: 2,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', px: 1.5 }}>
            <List>
              {ROUTES.map((route) => {
                const isActive = pathname === route.path;
                return (
                  <ListItem key={route.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => router.push(route.path)}
                      selected={isActive}
                      sx={{
                        borderRadius: 100,
                        px: 3,
                        py: 1.25,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'primary.dark',
                          '&:hover': { bgcolor: 'primary.light', filter: 'brightness(0.95)' }
                        },
                        '&.Mui-selected .MuiListItemIcon-root': {
                          color: 'primary.dark',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44, color: isActive ? 'primary.dark' : 'text.secondary' }}>
                        {route.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={route.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'primary.dark' : 'text.secondary',
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
