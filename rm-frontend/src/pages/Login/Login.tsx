// src/pages/Login/Login.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { login, clearError } from '@/store/slices/authSlice';
import { LoginRequest } from '@/types/auth.types';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

// Reusable styled component for dark theme consistency
const StyledDarkTextField = (props: any) => (
  <TextField
    {...props}
    variant="outlined"
    sx={{
      '& .MuiInputBase-root': { color: '#c9d1d9', backgroundColor: 'rgba(22, 27, 34, 0.5)' },
      '& .M-uiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b949e' },
      '& .MuiInputLabel-root': { color: '#8b949e' },
      '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#58a6ff' },
      '& .Mui-focused .MuiInputLabel-root': { color: '#58a6ff' },
      '& .MuiFormHelperText-root': { color: '#f85149' }, // Error text color
    }}
  />
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginRequest) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      const userRole = result.payload.user.role;
      switch (userRole) {
        case 'ADMIN': navigate('/admin/dashboard'); break;
        case 'CHEF': navigate('/chef/dashboard'); break;
        case 'CASHIER': navigate('/cashier/dashboard'); break;
        case 'CAPTAIN': navigate('/captain/orders'); break;
        default: navigate('/');
      }
    }
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      }}
    >
      <Paper
        elevation={0}
        sx={{
          zIndex: 1,
          p: { xs: 3, sm: 5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(22, 27, 34, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid #30363d',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: '#161b22', border: '1px solid #30363d' }}>
          <LockOutlined sx={{ color: '#8b949e' }}/>
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
          Manager Login
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              width: '100%',
              background: 'rgba(248, 81, 73, 0.15)',
              color: '#f85149',
              border: '1px solid rgba(248, 81, 73, 0.4)',
              '& .MuiAlert-icon': { color: '#f85149' },
            }}
          >
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
          <StyledDarkTextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            autoComplete="username"
            autoFocus
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          <StyledDarkTextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#238636',
              '&:hover': {
                backgroundColor: '#2ea043',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(35, 134, 54, 0.5)',
                color: 'rgba(240, 246, 252, 0.5)',
              },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#f0f6fc' }} /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;