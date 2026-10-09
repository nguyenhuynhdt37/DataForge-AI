"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Stack, 
  IconButton,
  Slider,
  Switch
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import FilterTiltShiftRoundedIcon from '@mui/icons-material/FilterTiltShiftRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';

export default function Android16Dashboard() {
  const [activeMining, setActiveMining] = useState(true);
  const [openVinoBoost, setOpenVinoBoost] = useState(true);
  const [uncertaintyWeight, setUncertaintyWeight] = useState(75);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', spaceY: 4 }}>
      
      {/* 1. Android 16 At a Glance Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1, color: 'text.primary', mb: 0.5 }}>
            GreenSM Hub
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Hệ thống điều phối Active Learning & Kiểm định mô hình YOLO11n
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ 
          px: 3, 
          py: 1.5, 
          borderRadius: 100, 
          bgcolor: 'primary.light', 
          color: 'primary.dark',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            mAP50-95 Target: 78.4%
          </Typography>
          <Typography variant="caption" sx={{ bgcolor: 'white', px: 1, py: 0.25, borderRadius: 100, fontWeight: 700 }}>
            +14.2%
          </Typography>
        </Paper>
      </Box>

      {/* 2. Android 16 Quick Settings Tiles (4 Ô điều khiển dạng viên thuốc lớn) */}
      <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, color: 'text.secondary', mb: 2 }}>
        Quick Controls & Services
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        
        {/* Tile 1: Two-Tier Active Mining */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 7, 
            bgcolor: activeMining ? 'primary.light' : 'background.paper',
            color: activeMining ? 'primary.dark' : 'text.primary',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 140
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                bgcolor: activeMining ? 'primary.main' : 'rgba(0,0,0,0.06)', 
                color: activeMining ? 'white' : 'inherit',
                p: 1.25, 
                borderRadius: 5 
              }}>
                <AutoAwesomeRoundedIcon />
              </Box>
              <Switch 
                checked={activeMining} 
                onChange={(e) => setActiveMining(e.target.checked)}
                color="primary"
              />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Active Mining
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                {activeMining ? '300 mẫu ứng viên' : 'Đang tạm dừng'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Tile 2: OpenVINO INT8 Acceleration */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 7, 
            bgcolor: openVinoBoost ? 'secondary.light' : 'background.paper',
            color: openVinoBoost ? 'secondary.dark' : 'text.primary',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 140
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                bgcolor: openVinoBoost ? 'secondary.main' : 'rgba(0,0,0,0.06)', 
                color: openVinoBoost ? 'white' : 'inherit',
                p: 1.25, 
                borderRadius: 5 
              }}>
                <SpeedRoundedIcon />
              </Box>
              <Switch 
                checked={openVinoBoost} 
                onChange={(e) => setOpenVinoBoost(e.target.checked)}
                color="secondary"
              />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                OpenVINO INT8
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                21.4 FPS • CPU Latency 46ms
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Tile 3: pHash Dedup Status */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 7, 
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 140
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ bgcolor: '#FFF3E0', color: '#E65100', p: 1.25, borderRadius: 5 }}>
                <FilterTiltShiftRoundedIcon />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100', bgcolor: '#FFE0B2', px: 1, py: 0.25, borderRadius: 100 }}>
                24.9% Lọc
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                pHash BK-Tree
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Loại bỏ 610 ảnh trùng lặp
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Tile 4: Two-Tier Consensus */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 7, 
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 140
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ bgcolor: '#E1F5FE', color: '#0277BD', p: 1.25, borderRadius: 5 }}>
                <SecurityRoundedIcon />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0277BD', bgcolor: '#B3E5FC', px: 1, py: 0.25, borderRadius: 100 }}>
                IoU &ge; 0.70
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Two-Tier Oracle
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                84.2% Tự duyệt bởi RT-DETR
              </Typography>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* 3. Main Bento: Android 16 Thick Pill Sliders & Slices Monitor */}
      <Grid container spacing={3}>
        
        {/* Left: Thick Expressive Volume/Weight Slider */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <MemoryRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Active Score Tuner (Android 16 Slider)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                Điều chỉnh trọng số Uncertainty (Ui) bằng thanh trượt dày thế hệ mới:
              </Typography>

              {/* Android 16 Thick Pill Slider */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Uncertainty Margin (Ui)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>{uncertaintyWeight}%</Typography>
                </Box>
                <Slider 
                  value={uncertaintyWeight} 
                  onChange={(_, val) => setUncertaintyWeight(val as number)}
                  sx={{ 
                    height: 28, // Siêu dày chuẩn Android 16
                    borderRadius: 100,
                    color: 'primary.main',
                    '& .MuiSlider-thumb': {
                      width: 24,
                      height: 24,
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    },
                    '& .MuiSlider-track': {
                      border: 'none',
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: 'rgba(0,0,0,0.08)',
                      opacity: 1
                    }
                  }} 
                />
              </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 6, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Công thức Active Score</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Si = (Ui • Wi • Ai) / Ei</Typography>
              </Box>
              <IconButton sx={{ bgcolor: 'white', color: 'primary.dark' }}>
                <ArrowForwardRoundedIcon />
              </IconButton>
            </Paper>
          </Paper>
        </Grid>

        {/* Right: Slices Breakdown Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              5 Lát cắt Gai góc (Hard Slices)
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Phân bổ số liệu thực tế được giám sát qua các camera đô thị:
            </Typography>

            <Stack spacing={2.5}>
              {[
                { name: 'Night Slice (Ban đêm)', count: 420, pct: 64, color: '#386A20' },
                { name: 'Small Object (< 32px)', count: 510, pct: 58, color: '#E65100' },
                { name: 'Occlusion (Che khuất)', count: 380, pct: 61, color: '#0277BD' },
                { name: 'Dense Traffic (Ùn ứ)', count: 320, pct: 69, color: '#6A1B9A' },
              ].map((slice, i) => (
                <Box key={i} sx={{ 
                  p: 2, 
                  borderRadius: 6, 
                  bgcolor: 'rgba(0, 0, 0, 0.03)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: slice.color }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{slice.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{slice.count} ảnh trong pool</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: slice.color }}>
                    {slice.pct}% mAP
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

      </Grid>

    </Box>
  );
}
