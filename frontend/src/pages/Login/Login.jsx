import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Business,
} from '@mui/icons-material';

export default function Login() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Login, 1 = Signup, 2 = Forgot Password
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setErrors({});
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (activeTab === 0 || activeTab === 1) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (activeTab === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) return;

    if (activeTab === 0) {
      // Login flow
      if (formData.email === 'admin@assetflow.com' && formData.password === 'admin123') {
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setErrorMsg('Invalid email or password. Hint: admin@assetflow.com / admin123');
      }
    } else if (activeTab === 1) {
      // Signup flow
      setSuccessMsg('Account created successfully! You can now log in.');
      setTimeout(() => {
        setActiveTab(0);
        setFormData({
          name: '',
          email: formData.email,
          password: '',
          confirmPassword: '',
          department: '',
        });
      }, 1500);
    } else {
      // Forgot Password flow
      setSuccessMsg('Password reset instructions sent to your email.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        bgcolor: '#f4f6f8',
      }}
    >
      {/* Left Pane - Branding & Illustrations */}
      <Box
        sx={{
          flex: 1.2,
          bgcolor: '#0f172a',
          color: '#ffffff',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid pattern background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundSize: '20px 20px',
            backgroundImage: 'linear-gradient(to right, grey 1px, transparent 1px), linear-gradient(to bottom, grey 1px, transparent 1px)',
          }}
        />

        <Box sx={{ zIndex: 1, maxWidth: '480px', textAlign: 'center' }}>
          {/* Logo badge */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              bgcolor: 'primary.main',
              borderRadius: 3,
              mb: 4,
              boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '2px' }}>
              AF
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, letterSpacing: '0.5px' }}>
            AssetFlow Enterprise ERP
          </Typography>
          
          <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, lineHeight: 1.6 }}>
            Modern Resource & Asset Lifecycle Platform. Designed to optimize department allocations, automate maintenance auditing, and prevent scheduling conflicts across the organization.
          </Typography>

          {/* Premium stats showcase */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              mt: 6,
              pt: 6,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.light' }}>
                99.9%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Uptime Verified
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.light' }}>
                15k+
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Assets Tracked
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.light' }}>
                0
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Double Allocations
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Pane - Form Interface */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: '440px',
            p: 4.5,
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header Title */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Access your AssetFlow corporate dashboard
            </Typography>
          </Box>

          {/* Form Tabs */}
          <Tabs
            value={activeTab > 1 ? 0 : activeTab}
            onChange={handleTabChange}
            centered
            sx={{
              mb: 3,
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                minWidth: '100px',
              },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Register" />
          </Tabs>

          {/* Action Messages */}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Form Action */}
          <form onSubmit={handleSubmit} noValidate>
            {activeTab === 2 ? (
              // Forgot Password Layout
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Enter your email address below and we'll send you instructions to reset your password.
                </Typography>
                <TextField
                  fullWidth
                  label="Corporate Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ mt: 1, py: 1.3, fontWeight: 600 }}
                >
                  Send Reset Link
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setActiveTab(0)}
                  sx={{ fontWeight: 600 }}
                >
                  Back to Sign In
                </Button>
              </Box>
            ) : (
              // Login / Signup Layout
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {activeTab === 1 && (
                  <>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      error={!!errors.department}
                      helperText={errors.department}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}

                <TextField
                  fullWidth
                  label="Corporate Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {activeTab === 1 && (
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                {activeTab === 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: -0.5,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Remember me
                        </Typography>
                      }
                    />
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setActiveTab(2)}
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.825rem',
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                )}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ mt: 1.5, py: 1.3, fontWeight: 600 }}
                >
                  {activeTab === 0 ? 'Sign In to Dashboard' : 'Register Corporate Account'}
                </Button>
              </Box>
            )}
          </form>

          {/* Quick Sandbox Login Indicator */}
          {activeTab === 0 && (
            <Box
              sx={{
                mt: 4,
                p: 2,
                borderRadius: 2,
                bgcolor: '#fff8e1',
                border: '1px solid #ffe082',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#b78103', fontWeight: 600 }}>
                💡 Admin Credentials Sandbox Hint:<br />
                Email: <strong>admin@assetflow.com</strong> / Pass: <strong>admin123</strong>
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
