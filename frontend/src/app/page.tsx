"use client";

import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  LinearProgress, 
  Paper, 
  Stack, 
  Fab 
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SavingsIcon from '@mui/icons-material/Savings';
import InsightsIcon from '@mui/icons-material/Insights';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export default function OverviewDashboard() {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 400, color: 'text.primary', mb: 1 }}>
            Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hiệu suất mô hình hiện tại và phân bổ dữ liệu gán nhãn
          </Typography>
        </Box>
        <Button variant="contained" color="primary" endIcon={<KeyboardArrowRightIcon />}>
          Chạy vòng lặp mới
        </Button>
      </Box>

      {/* Metrics Row (Tonal Cards) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <TrendingUpIcon color="primary" />, title: 'Độ chính xác (mAP)', value: '78.4%', label: '+14.2% so với V0' },
          { icon: <SavingsIcon color="primary" />, title: 'Giờ công tiết kiệm', value: '92 Giờ', label: 'Tương đương 3.8x hiệu suất' },
          { icon: <CheckCircleIcon color="primary" />, title: 'Tự động duyệt', value: '84.2%', label: 'IoU đồng thuận > 0.70' },
        ].map((metric, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ bgcolor: 'background.paper', p: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'center' }}>
                  <Box sx={{ 
                    bgcolor: 'primary.light', 
                    borderRadius: 2, 
                    p: 1, 
                    display: 'flex', 
                    color: 'primary.dark' 
                  }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {metric.title}
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 400, mb: 1, color: 'text.primary' }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 4, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="text.primary">Cấu trúc Lát cắt Dữ liệu (Data Slices)</Typography>
              <Typography variant="body2" color="text.secondary">Phân bổ 5 lát cắt khó theo quy chuẩn</Typography>
            </Box>
            
            <Stack spacing={4}>
              {[
                { label: 'Night Slice (Ban đêm)', val: 64.2, count: 420 },
                { label: 'Small Object (<32px)', val: 58.9, count: 510 },
                { label: 'Occlusion (Che khuất)', val: 61.5, count: 380 },
              ].map((slice, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {slice.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{slice.count} mẫu</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={slice.val} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'secondary.light',
                      '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' }
                    }} 
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 4, 
            bgcolor: 'primary.light',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box>
              <InsightsIcon sx={{ color: 'primary.dark', fontSize: 32, mb: 2 }} />
              <Typography variant="h6" color="primary.dark" sx={{ mb: 1 }}>
                Pipeline Sẵn sàng
              </Typography>
              <Typography variant="body2" color="primary.dark" sx={{ mb: 3 }}>
                Thuật toán PCA đã phân cụm thành công 1,840 mẫu chưa gán nhãn.
              </Typography>
            </Box>
            <Button variant="contained" color="primary" fullWidth sx={{ py: 1.5 }}>
              Mở Active Mining
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Floating Action Button (M3 FAB) */}
      <Fab color="secondary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 3 }}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
