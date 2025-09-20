// src/components/common/LoadingSpinner.tsx
import { CircularProgress, Box } from '@mui/material';

export const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);