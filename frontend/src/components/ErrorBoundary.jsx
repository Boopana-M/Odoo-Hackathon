import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, m: 4, bgcolor: '#fee2e2', borderRadius: 2, border: '1px solid #ef4444' }}>
          <Typography variant="h5" color="error.dark" fontWeight="600" mb={2}>Something went wrong.</Typography>
          <Typography variant="body2" color="error.dark" mb={3}>The application encountered an unexpected error. Please try refreshing.</Typography>
          <Button variant="contained" color="error" onClick={() => window.location.reload()}>Reload Application</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
