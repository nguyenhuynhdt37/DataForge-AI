"use client";

import React from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  Typography,
  Stack,
  IconButton
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import DrawRoundedIcon from '@mui/icons-material/DrawRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import SignalCellular4BarRoundedIcon from '@mui/icons-material/SignalCellular4BarRounded';
import BatteryFullRoundedIcon from '@mui/icons-material/BatteryFullRounded';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import { usePathname, useRouter } from 'next/navigation';

// Theme Android 16 Expressive (Dynamic Tonal Mesh)
const android16Theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#386A20',       // Android 16 Sage Green Primary
      light: '#B7F397',      // Primary Container (Gạch active)
      dark: '#042100',       // On Primary Container
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#55624C',
      light: '#D9E7CB',      // Secondary Container
      dark: '#131F0D',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5ED',    // Android 16 Wallpaper Tint
      paper: 'rgba(255, 255, 255, 0.72)', // Frosted glass surface
    },
    text: {
      primary: '#191E13',
      secondary: '#43483E',
    }
  },
  shape: {
    borderRadius: 28, // Chuẩn siêu bo tròn của Android 16
  },
  typography: {
    fontFamily: '"Roboto", "Google Sans", "Helvetica", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          padding: '12px 24px',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }
      }
    }
  }
});

const NAV_ITEMS = [
  { label: 'Overview', path: '/', icon: <DashboardRoundedIcon /> },
  { label: 'Data Lab', path: '/data-lab', icon: <StorageRoundedIcon /> },
  { label: 'Mining', path: '/active-mining', icon: <TuneRoundedIcon /> },
  { label: 'Studio', path: '/hitl-studio', icon: <DrawRoundedIcon /> },
  { label: 'Metrics', path: '/benchmark', icon: <InsightsRoundedIcon /> },
];

export default function M3Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ThemeProvider theme={android16Theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, #E8F5E9 0%, #F5F5ED 40%, #EFEBE9 90%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        pb: 12 // Chừa chỗ cho Floating Nav Dock
      }}>
        
        {/* Android 16 Top Status Bar + Rich Ongoing Notification Pill */}
        <Box sx={{ 
          px: { xs: 2, md: 5 }, 
          py: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {/* Giờ + Ngày */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
              09:41
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Thứ sáu, 9 tháng 10
            </Typography>
          </Box>

          {/* Android 16 Rich Ongoing Notification (Pill trạng thái động) */}
          <Box sx={{ 
            bgcolor: 'primary.light', 
            color: 'primary.dark',
            px: 2.5, 
            py: 1, 
            borderRadius: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            boxShadow: '0 4px 16px rgba(56, 106, 32, 0.15)',
            border: '1px solid rgba(255,255,255,0.6)'
          }}>
            <PlayCircleFilledWhiteRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              HITL Cycle #1 • 88.5% IoU Consensus
            </Typography>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
          </Box>

          {/* Icons hệ thống Android 16 */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <WifiRoundedIcon fontSize="small" sx={{ color: 'text.primary' }} />
            <SignalCellular4BarRoundedIcon fontSize="small" sx={{ color: 'text.primary' }} />
            <BatteryFullRoundedIcon fontSize="small" sx={{ color: 'text.primary' }} />
          </Stack>
        </Box>

        {/* Khung nội dung chính */}
        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 5 }, py: 2 }}>
          {children}
        </Box>

        {/* Android 16 Floating Gesture Navigation Dock (Thanh dock nổi ở đáy) */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 24, 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px)',
          borderRadius: 100,
          p: 1,
          px: 2,
          display: 'flex',
          gap: 1,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Box
                key={item.path}
                onClick={() => router.push(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: isActive ? 2.5 : 1.5,
                  py: 1,
                  borderRadius: 100,
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.dark' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.light' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                {item.icon}
                {isActive && (
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

      </Box>
    </ThemeProvider>
  );
}
