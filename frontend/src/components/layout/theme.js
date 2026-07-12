import { createTheme } from '@mui/material/styles';

const enterpriseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional Trust Blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#475569', // Slate grey for secondary actions
    },
    background: {
      default: '#f4f6f8', // Very light grey for the main app background
      paper: '#ffffff',
    },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02', light: '#fff3e0' },
    error: { main: '#d32f2f' },
    text: {
      primary: '#1e293b', // Slate-800 instead of pure black
      secondary: '#64748b', // Slate-500
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, color: '#1e293b' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8, // Base 8px border radius
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // 12px for main container cards
          boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', // Soft premium shadow
          border: '1px solid #f1f5f9',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        }
      }
    }
  }
});

export default enterpriseTheme;
