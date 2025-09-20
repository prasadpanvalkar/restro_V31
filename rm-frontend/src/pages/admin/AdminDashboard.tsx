// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Fade,
  Grow,
  Slide,
  Avatar,
  CircularProgress,
  Stack
} from '@mui/material';

import {
  TrendingUp,
  Restaurant,
  AttachMoney,
  Refresh,
  PersonAdd,
  Assessment,
  Speed,
  TrendingUpOutlined,
  DashboardOutlined,
  NotificationsOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import billingService from '@/services/api/billing.service';
import orderService from '@/services/api/order.service';
import { Order } from '@/types/order.types';
import { format } from 'date-fns';

interface Analytics {
  sales_today: string;
  sales_this_month: string;
  top_dish_today: string;
  top_dish_this_month: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, ordersData] = await Promise.all([
        billingService.getRestaurantAnalytics(),
        orderService.getRestaurantOrders(),
      ]);
      
      setAnalytics(analyticsData);
      setRecentOrders(ordersData.slice(0, 5)); // Show only 5 recent orders
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        width: '100%',
        minHeight: '100vh',
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: '#58a6ff' }} />
          <Typography variant="h6" sx={{ color: '#c9d1d9' }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      background: '#0d1117',
      color: '#c9d1d9',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 15% 50%, rgba(3, 169, 244, 0.1) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(13, 71, 161, 0.1) 0%, transparent 40%)',
        zIndex: 0,
        pointerEvents: 'none'
      },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 1
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '1600px',
        p: { xs: 2, sm: 3, md: 4 },
        mx: 'auto',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ 
                width: 64, 
                height: 64, 
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                color: '#2196f3'
              }}>
                <DashboardOutlined sx={{ fontSize: '2rem' }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                    letterSpacing: '-0.02em',
                    color: '#f0f6fc'
                  }}
                >
                  Dashboard
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#8b949e',
                    fontWeight: 400,
                  }}
                >
                  Real-time Analytics & Management Hub
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                sx={{ 
                  backgroundColor: '#161b22', color: '#8b949e', border: '1px solid #30363d',
                  '&:hover': { backgroundColor: '#1f242c', color: '#c9d1d9', borderColor: '#8b949e' },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <NotificationsOutlined />
              </IconButton>
              <IconButton 
                onClick={fetchDashboardData}
                sx={{ 
                  backgroundColor: '#161b22', color: '#8b949e', border: '1px solid #30363d',
                  '&:hover': { backgroundColor: '#1f242c', color: '#c9d1d9', borderColor: '#8b949e', transform: 'rotate(180deg)'},
                  transition: 'all 0.4s ease-in-out'
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Fade>

        {/* MAIN LAYOUT GRID */}
        <Grid container spacing={4}>
          
          {/* Main Content Column (Left) */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={4}>
              {/* Stat Cards Grid */}
              <Grid container spacing={4}>
                {[
                  { title: "Today's Revenue", value: `₹${analytics?.sales_today || '0'}`, icon: <AttachMoney />, trend: "+12.5%", color: '#2e7d32' },
                  { title: "Monthly Revenue", value: `₹${analytics?.sales_this_month || '0'}`, icon: <TrendingUp />, trend: "+8.2%", color: '#1565c0' },
                  { title: "Popular Today", value: analytics?.top_dish_today || 'No data', icon: <Restaurant />, color: '#c65f00' },
                  { title: "Monthly Favorite", value: analytics?.top_dish_this_month || 'No data', icon: <Restaurant />, color: '#6a1b9a' },
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Grow in timeout={600 + index * 100} style={{ transformOrigin: '0 0 0' }}>
                      <Card elevation={0} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d', transition: 'all 0.3s ease-in-out', height: '100%', '&:hover': { transform: 'translateY(-5px)', borderColor: 'rgba(139, 148, 158, 0.5)', background: 'rgba(28, 33, 40, 0.9)'}}}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: item.color, mr: 2, width: 40, height: 40 }}>{item.icon}</Avatar>
                            <Typography variant="subtitle2" sx={{ color: '#8b949e' }}>{item.title}</Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: '#f0f6fc', mb: item.trend ? 1 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</Typography>
                          {item.trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingUpOutlined sx={{ fontSize: '1rem', color: '#2e7d32' }} />
                              <Typography variant="body2" sx={{ color: '#56d364', fontWeight: 500 }}>{item.trend}</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grow>
                  </Grid>
                ))}
              </Grid>

              {/* Recent Orders Table */}
              <Slide direction="up" in timeout={800}>
                <Card elevation={0} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Assessment sx={{ color: '#8b949e', mr: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#f0f6fc' }}>Recent Orders</Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow><TableCell sx={{ fontWeight: 600, color: '#8b949e', borderBottom: '1px solid #30363d' }}>Table</TableCell><TableCell sx={{ fontWeight: 600, color: '#8b949e', borderBottom: '1px solid #30363d' }}>Customer</TableCell><TableCell sx={{ fontWeight: 600, color: '#8b949e', borderBottom: '1px solid #30363d' }}>Status</TableCell><TableCell sx={{ fontWeight: 600, color: '#8b949e', borderBottom: '1px solid #30363d' }}>Time</TableCell></TableRow>
                        </TableHead>
                        <TableBody>
                          {recentOrders.map((order) => (
                            <TableRow key={order.id} sx={{ '&:hover': { backgroundColor: 'rgba(139, 148, 158, 0.1)' }, '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell sx={{ color: '#c9d1d9', borderBottom: '1px solid #21262d' }}>{order.table_number}</TableCell>
                              <TableCell sx={{ color: '#c9d1d9', fontWeight: 500, borderBottom: '1px solid #21262d' }}>{order.customer_name}</TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #21262d' }}><Chip label={order.payment_status} size="small" sx={{ fontWeight: 500, color: order.payment_status === 'PAID' ? '#3fb950' : '#d29922', backgroundColor: order.payment_status === 'PAID' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(210, 153, 34, 0.15)', border: `1px solid ${order.payment_status === 'PAID' ? 'rgba(63, 185, 80, 0.4)' : 'rgba(210, 153, 34, 0.4)'}`}} /></TableCell>
                              <TableCell sx={{ color: '#8b949e', borderBottom: '1px solid #21262d' }}>{format(new Date(order.created_at), 'HH:mm')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Slide>
            </Stack>
          </Grid>

          {/* Sidebar Column (Right) */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              {/* Quick Actions Card */}
              <Slide direction="left" in timeout={900}>
                <Card elevation={0} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Speed sx={{ color: '#8b949e', mr: 2 }} /><Typography variant="h6" sx={{ fontWeight: 600, color: '#f0f6fc' }}>Quick Actions</Typography>
                    </Box>
                    <Stack spacing={2}>
                      <Button fullWidth onClick={() => navigate('/admin/menu')} sx={{ py: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600, backgroundColor: '#2188ff', color: 'white', '&:hover': { backgroundColor: '#3895ff' }}}>Manage Menu</Button>
                      <Button fullWidth variant="outlined" startIcon={<PersonAdd />} onClick={() => navigate('/admin/staff')} sx={{ py: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#30363d', color: '#58a6ff', '&:hover': { borderColor: '#8b949e', backgroundColor: 'rgba(88, 166, 255, 0.1)' }}}>Manage Staff</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Slide>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;