// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Login from './pages/Login/Login';
import ChefDashboard from './pages/chef/ChefDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';
import MenuManagement from './pages/admin/MenuManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import CaptainOrders from './pages/captain/CaptainOrders';
import CustomerMenu from './pages/customer/CustomerMenu';
import StaffCredentials from './pages/admin/StaffCredentials';
import OrderTracking from './pages/customer/OrderTracking';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/menu/:restaurantSlug" element={<CustomerMenu />} />
            <Route path="/track/:restaurantSlug" element={<OrderTracking />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <MenuManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <StaffCredentials />
                </PrivateRoute>
              }
            />
            
            {/* Chef Routes */}
            <Route
              path="/chef/dashboard"
              element={
                <PrivateRoute allowedRoles={['CHEF', 'ADMIN']}>
                  <ChefDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Cashier Routes */}
            <Route
              path="/cashier/dashboard"
              element={
                <PrivateRoute allowedRoles={['CASHIER', 'ADMIN']}>
                  <CashierDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Captain Routes */}
            <Route
              path="/captain/orders"
              element={
                <PrivateRoute allowedRoles={['CAPTAIN', 'ADMIN']}>
                  <CaptainOrders />
                </PrivateRoute>
              }
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;