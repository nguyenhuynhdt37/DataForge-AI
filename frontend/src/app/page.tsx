"use client";

import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stack,
  IconButton,
  Breadcrumbs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  AvatarGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function OverviewDashboard() {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', position: 'relative', minHeight: '100%' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3, fontSize: '0.875rem' }}>
        <Typography color="text.secondary">Featured</Typography>
        <Typography color="text.secondary">Pipeline</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>YOLO11n</Typography>
      </Breadcrumbs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={6}>
        
        {/* Bên trái: Hero Image Gallery (Mô phỏng hình cô gái mặc áo sọc) */}
        <Box sx={{ flex: 1 }}>
          {/* Ảnh chính to */}
          <Box sx={{ 
            width: '100%', 
            height: 480, 
            bgcolor: '#D5C5B9', // Màu be giống nền ảnh
            borderRadius: 6,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {/* Giả lập đường sọc của áo bằng CSS */}
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              background: 'repeating-linear-gradient( 90deg, #f4f4f4, #f4f4f4 2px, #333 2px, #333 4px )',
              opacity: 0.8
            }} />
          </Box>
          
          {/* 2 Ảnh nhỏ bên dưới */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1, height: 160, bgcolor: '#E5D6E1', borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ width: '100%', height: '100%', background: 'repeating-linear-gradient( 90deg, #f4f4f4, #f4f4f4 2px, #666 2px, #666 4px )', opacity: 0.6 }} />
            </Box>
            <Box sx={{ flex: 1, height: 160, bgcolor: '#C9BAC9', borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ width: '100%', height: '100%', background: 'repeating-linear-gradient( 90deg, #f4f4f4, #f4f4f4 1px, #888 1px, #888 3px )', opacity: 0.4 }} />
            </Box>
          </Stack>
        </Box>

        {/* Bên phải: Nội dung chi tiết (Mô phỏng Title, Add to basket, Accordion) */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h3" sx={{ fontSize: '2.5rem', fontWeight: 400, color: '#1D192B' }}>
              GreenSM Detection
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 400, color: '#1D192B' }}>
              78.4%
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            Mô hình YOLO11n đã được tinh chỉnh qua vòng lặp Active Learning thứ 3. 
            Nhận diện hoàn hảo taxi GreenSM trong các điều kiện thiếu sáng và che khuất.
          </Typography>

          {/* Size & Color giả lập (Slice & Model selection) */}
          <Stack direction="row" spacing={3} sx={{ alignItems: "center", mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Slice</Typography>
            <Stack direction="row" spacing={1}>
              {['V0', 'V1', 'V2', 'V3'].map((size, idx) => (
                <Box key={size} sx={{ 
                  width: 40, height: 40, 
                  borderRadius: '50%', 
                  border: idx === 1 ? '1px solid transparent' : '1px solid #E5E5E5',
                  bgcolor: idx === 1 ? 'primary.light' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', fontWeight: idx === 1 ? 600 : 400,
                  color: idx === 1 ? 'primary.dark' : 'text.primary',
                  cursor: 'pointer'
                }}>
                  {size}
                </Box>
              ))}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ alignItems: "center", mb: 5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Status</Typography>
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#000000' }} />
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#F4D8A6' }} />
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#98DFE9' }} />
            </Stack>
          </Stack>

          {/* Add to basket Row */}
          <Stack direction="row" spacing={2} sx={{ mb: 5 }}>
            <Button 
              variant="contained" 
              fullWidth 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.dark',
                '&:hover': { bgcolor: '#F0C8D4' },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Run Pipeline
            </Button>
            <IconButton sx={{ 
              bgcolor: 'primary.light', 
              color: 'primary.dark', 
              borderRadius: 4, 
              width: 52, 
              height: 52,
              '&:hover': { bgcolor: '#F0C8D4' }
            }}>
              <FavoriteBorderIcon />
            </IconButton>
          </Stack>

          {/* Accordions */}
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ fontWeight: 500 }} color="#1D192B">More details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Dữ liệu huấn luyện gồm 2,450 ảnh được lọc trùng lặp qua thuật toán pHash.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ fontWeight: 500 }} color="#1D192B">Ratings and Reviews</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                ★★★★☆ Perfect transition piece, just need more options.<br/><br/>
                I've been using this model since it arrived. As someone who is constantly monitoring traffic... <strong>Read more</strong>
              </Typography>
            </AccordionDetails>
          </Accordion>

        </Box>
      </Stack>

      {/* Floating Action Pill (Giống giỏ hàng nổi góc dưới phải của ảnh) */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        bgcolor: 'primary.light',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        pr: 3,
        boxShadow: '0 4px 20px rgba(152,64,97,0.15)',
        zIndex: 10
      }}>
        <IconButton size="small" sx={{ color: 'primary.dark', mr: 1 }}>
          <ShoppingCartIcon fontSize="small" />
        </IconButton>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem', borderColor: 'primary.light' } }}>
          <Avatar sx={{ bgcolor: '#4CAF50' }}>V0</Avatar>
          <Avatar sx={{ bgcolor: '#2196F3' }}>V1</Avatar>
        </AvatarGroup>
        <Typography sx={{ ml: 1, color: 'primary.dark', fontWeight: 600, fontSize: '0.875rem' }}>+1</Typography>
      </Box>

    </Box>
  );
}
