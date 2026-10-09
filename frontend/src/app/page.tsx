"use client";

import React from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Slider, 
  Stack,
  Chip,
  Paper
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DataObjectIcon from '@mui/icons-material/DataObject';

const muiDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10B981', // Màu lục dạ quang GreenSM
      contrastText: '#000000',
    },
    background: {
      default: '#07090E',
      paper: '#131A2A',
    },
  },
  shape: {
    borderRadius: 16, // Bo tròn chuẩn Material Design 3
  },
  typography: {
    fontFamily: 'inherit',
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

export default function MuiDemoPage() {
  return (
    <ThemeProvider theme={muiDarkTheme}>
      <CssBaseline />
      
      <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
          <AutoAwesomeIcon color="primary" fontSize="large" />
          <Typography variant="h3" sx={{ fontWeight: "bold" }}>
            GreenSM <Typography component="span" variant="h3" color="primary">MUI Demo</Typography>
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          
          {/* Card Material 3 */}
          <Card elevation={4} sx={{ flex: 1 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="overline">
                  Active Mining Control
                </Typography>
                <Chip label="Tier 1" color="primary" size="small" />
              </Box>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
                Cấu hình Trọng số (Weights)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Material Design 3 cung cấp các component Slider và Button cực kỳ chuẩn mực, dễ dàng thao tác bằng chuột hoặc chạm.
              </Typography>
              
              <Typography gutterBottom>Độ đa dạng (Diversity - Ai)</Typography>
              <Slider 
                defaultValue={70} 
                valueLabelDisplay="auto" 
                color="primary" 
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>Độ khó gán nhãn (Ease - Ei)</Typography>
              <Slider 
                defaultValue={30} 
                valueLabelDisplay="auto" 
                color="secondary" 
                sx={{ mb: 4 }}
              />
              
              <Stack direction="row" spacing={2}>
                <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} disableElevation>
                  Chạy PCA
                </Button>
                <Button variant="outlined" size="large" color="inherit">
                  Reset
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Paper Information Display */}
          <Paper elevation={0} sx={{ flex: 1, p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <DataObjectIcon color="info" />
              <Typography variant="h6">Trạng thái API</Typography>
            </Box>
            
            <Stack spacing={2}>
              {[
                { label: 'Tổng ảnh (Raw)', value: '2,450' },
                { label: 'Night Slice', value: '420 ảnh' },
                { label: 'Đồng thuận IoU', value: '88.5%' }
              ].map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography color="text.secondary">{item.label}</Typography>
                  <Typography sx={{ fontWeight: "bold" }} color="primary">{item.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

        </Stack>
      </Box>
    </ThemeProvider>
  );
}
