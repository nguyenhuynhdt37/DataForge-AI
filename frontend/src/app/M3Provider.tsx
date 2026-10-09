"use client";

import React from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Stack
} from '@mui/material';
import DiamondIcon from '@mui/icons-material/Diamond';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { usePathname, useRouter } from 'next/navigation';

// Theme chuẩn M3 Expressive (Mô phỏng chính xác tông màu Soft Rose/Pink từ ảnh)
const m3ExpressiveTheme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#984061', // Đỏ đô/Hồng đậm
      light: '#FFD9E2', // Hồng nhạt (Pill background)
      dark: '#3E001D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#74565F',
      light: '#FFD9E2',
      dark: '#2B151C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFF0F5', // Nền tổng thể màu hồng pastel nhạt
      paper: '#FFFFFF',   // Nền thẻ màu trắng
    },
    text: {
      primary: '#201A1B',
      secondary: '#504347',
    }
  },
  shape: {
    borderRadius: 24, // Bo góc lớn đặc trưng của M3 Expressive
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
    h3: { fontWeight: 400, color: '#201A1B' },
    h6: { fontWeight: 500 },
    body2: { color: '#504347', lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 100, // Nút tròn xoe dạng Pill
          padding: '12px 24px',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: 'none', // Hoàn toàn không dùng bóng gắt
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFF0F5', // Giống màu Accordion trong ảnh
          boxShadow: 'none',
          '&:before': { display: 'none' }, // Bỏ gạch chân mặc định của MUI
          borderRadius: '16px !important',
          margin: '8px 0',
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 0',
          borderRadius: 16,
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          margin: '0 auto',
          padding: '4px 16px',
          borderRadius: 16,
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          marginTop: 8,
          marginBottom: 0,
        },
        primary: {
          fontSize: '0.65rem',
          fontWeight: 600,
          textAlign: 'center',
        }
      }
    }
  }
});

const NAV_WIDTH = 96;

const ROUTES = [
  { text: 'Featured', path: '/', icon: <DashboardIcon fontSize="small" /> },
  { text: 'Data Lab', path: '/data-lab', icon: <StorageIcon fontSize="small" /> },
  { text: 'Mining', path: '/active-mining', icon: <TuneIcon fontSize="small" /> },
  { text: 'Studio', path: '/hitl-studio', icon: <EditIcon fontSize="small" /> },
  { text: 'Reports', path: '/benchmark', icon: <AssessmentIcon fontSize="small" /> },
];

export default function M3Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ThemeProvider theme={m3ExpressiveTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default', p: { xs: 0, md: 2 } }}>
        
        {/* Lớp bọc màu trắng cho giao diện chính giống trong hình (Tablet/Desktop view) */}
        <Box sx={{ 
          display: 'flex', 
          width: '100%', 
          bgcolor: 'background.paper', 
          borderRadius: { xs: 0, md: 4 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0px 10px 40px rgba(0,0,0,0.05)' }
        }}>
          
          {/* Navigation Rail (Giống hệt ảnh bên trái màn hình phải) */}
          <Box sx={{ 
            width: NAV_WIDTH, 
            flexShrink: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            borderRight: '1px solid rgba(0,0,0,0.04)'
          }}>
            <DiamondIcon sx={{ color: '#984061', fontSize: 32, mb: 4 }} />
            
            <List sx={{ width: '100%', px: 1 }}>
              {ROUTES.map((route) => {
                const isActive = pathname === route.path;
                return (
                  <ListItem key={route.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton 
                      onClick={() => router.push(route.path)}
                      sx={{
                        '&:hover': { bgcolor: 'transparent' }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        bgcolor: isActive ? 'primary.light' : 'transparent',
                        color: isActive ? 'primary.dark' : 'text.secondary',
                        transition: 'background-color 0.2s',
                        '& svg': { fontSize: '1.25rem' }
                      }}>
                        {route.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={route.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isActive ? 'primary.dark' : 'text.secondary',
                            opacity: isActive ? 1 : 0.7
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Main Content Area */}
          <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
