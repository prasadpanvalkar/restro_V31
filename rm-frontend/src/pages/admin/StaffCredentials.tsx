// src/pages/Admin/StaffCredentials.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { Person, VpnKey, SupervisedUserCircle } from '@mui/icons-material';
import apiClient from '@/services/api/config';
import toast from 'react-hot-toast';

interface RoleCredential {
  id: number;
  role: 'CAPTAIN' | 'CHEF' | 'CASHIER';
  username: string;
}

const StaffCredentials: React.FC = () => {
  const [credentials, setCredentials] = useState<RoleCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCredential, setNewCredential] = useState({
    role: 'CHEF' as const,
    username: '',
    password: '',
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<RoleCredential[]>('/auth/staff-credentials/');
      setCredentials(response.data);
    } catch (error) {
      toast.error("Failed to fetch credentials.");
      console.error("Failed to fetch credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newCredential.username || !newCredential.password) {
      toast.error("Username and password are required.");
      return;
    }
    try {
      await apiClient.post('/auth/staff-credentials/', newCredential);
      toast.success('Credentials saved successfully!');
      fetchCredentials();
      setNewCredential({ role: 'CHEF', username: '', password: '' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.username?.[0] || "Failed to save credentials.";
      toast.error(errorMessage);
      console.error("Failed to save credentials:", error);
    }
  };

  // Reusable styled components for dark theme consistency
  const StyledDarkTextField = (props: any) => (
    <TextField
      {...props}
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': { color: '#c9d1d9', backgroundColor: 'rgba(22, 27, 34, 0.5)' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b949e' },
        '& .MuiInputLabel-root': { color: '#8b949e' },
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#58a6ff' },
        '& .Mui-focused .MuiInputLabel-root': { color: '#58a6ff' },
      }}
    />
  );
  
  const StyledDarkSelect = (props: any) => (
    <Select
      {...props}
      MenuProps={{ PaperProps: { sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' }}}}
      sx={{
        color: '#c9d1d9', backgroundColor: 'rgba(22, 27, 34, 0.5)',
        '.MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b949e' },
        '.MuiSvgIcon-root': { color: '#8b949e' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#58a6ff' },
      }}
    />
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#58a6ff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', minHeight: '100vh', background: '#0d1117', color: '#c9d1d9',
      '&::before': { content: '""', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 15% 50%, rgba(3, 169, 244, 0.1) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(13, 71, 161, 0.1) 0%, transparent 40%)', zIndex: 0, pointerEvents: 'none' },
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      <Box sx={{ maxWidth: '1600px', mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#f0f6fc', mb: 4 }}>
          Staff Credentials Management
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                  Add/Update Credentials
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel sx={{ color: '#8b949e' }}>Role</InputLabel>
                  <StyledDarkSelect
                    value={newCredential.role}
                    label="Role"
                    onChange={(e) => setNewCredential({ ...newCredential, role: e.target.value as any })}
                  >
                    <MenuItem value="CHEF">Chef</MenuItem>
                    <MenuItem value="CASHIER">Cashier</MenuItem>
                    <MenuItem value="CAPTAIN">Captain</MenuItem>
                  </StyledDarkSelect>
                </FormControl>
                <StyledDarkTextField
                  fullWidth
                  label="Username"
                  value={newCredential.username}
                  onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                  margin="normal"
                />
                <StyledDarkTextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newCredential.password}
                  onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                  margin="normal"
                />
                <Button 
                  variant="contained" 
                  onClick={handleSubmit} 
                  sx={{ 
                    mt: 2, 
                    textTransform: 'none', 
                    fontWeight: 600, 
                    backgroundColor: '#238636', 
                    '&:hover': { backgroundColor: '#2ea043' }
                  }}
                >
                  Save Credentials
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                  Current Credentials
                </Typography>
                <List>
                  {credentials.map((cred) => (
                    <ListItem key={cred.id} sx={{ borderBottom: '1px solid #21262d', '&:last-child': { borderBottom: 0 } }}>
                      <ListItemIcon>
                        <SupervisedUserCircle sx={{ color: '#8b949e' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={cred.role}
                        secondary={cred.username}
                        primaryTypographyProps={{ fontWeight: 600, color: '#c9d1d9' }}
                        secondaryTypographyProps={{ color: '#8b949e' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StaffCredentials;