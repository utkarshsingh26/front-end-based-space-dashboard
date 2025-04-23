import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ExploreIcon from '@mui/icons-material/Explore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CircularProgress from '@mui/material/CircularProgress';
import vectorDbService from '../services/api';

function DiscoveryFlow({ onSelectLocation, mapRef }) {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discoveryPath, setDiscoveryPath] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isDiscoveryActive, setIsDiscoveryActive] = useState(false);
  const timerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Effect to handle navigation when active step changes
  useEffect(() => {
    if (isDiscoveryActive && discoveryPath.length > 0 && activeStep < discoveryPath.length) {
      const currentLocation = discoveryPath[activeStep];
      onSelectLocation({
        lat: currentLocation.lat,
        long: currentLocation.long,
        title: currentLocation.title,
        summary: currentLocation.summary,
        url: currentLocation.url,
        date: currentLocation.date
      });
    }
  }, [activeStep, isDiscoveryActive, discoveryPath, onSelectLocation]);

  const startDiscovery = async () => {
    if (!keyword.trim()) {
      setError('Please enter a keyword to start discovery');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsDiscoveryActive(false);
    setDiscoveryPath([]);
    setActiveStep(0);

    try {
      // Get discovery path from the API
      const results = await vectorDbService.getDiscoveryPath(keyword);
      
      if (results.length === 0) {
        setError('No events found for this keyword. Try a different one.');
        setIsLoading(false);
        return;
      }
      
      setDiscoveryPath(results);
      setIsDiscoveryActive(true);
      setActiveStep(0);
      
      // Automatically navigate to the first location
      onSelectLocation({
        lat: results[0].lat,
        long: results[0].long,
        title: results[0].title,
        summary: results[0].summary,
        url: results[0].url,
        date: results[0].date
      });
      
    } catch (error) {
      console.error('Error starting discovery:', error);
      setError('Failed to start discovery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep < discoveryPath.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleAutoPlay = () => {
    // Start from current step
    let currentStep = activeStep;
    
    const playNextStep = () => {
      if (currentStep < discoveryPath.length - 1) {
        currentStep += 1;
        setActiveStep(currentStep);
        
        // Schedule next step
        timerRef.current = setTimeout(playNextStep, 5000); // 5 seconds per location
      }
    };
    
    // Start the auto-play sequence
    timerRef.current = setTimeout(playNextStep, 5000);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: 800,
        zIndex: 1000,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
        }}
      >
        {!isDiscoveryActive ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              Discovery Flow
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter a keyword to start a guided tour of related space events on the map.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Enter keyword (e.g., Elon Musk, SpaceX, Mars)"
                variant="outlined"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    startDiscovery();
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={startDiscovery}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <ExploreIcon />}
              >
                Discover
              </Button>
            </Box>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Discovery: {keyword}
              </Typography>
              <Box>
                <Button 
                  size="small" 
                  onClick={() => {
                    setIsDiscoveryActive(false);
                    stopAutoPlay();
                  }}
                >
                  New Discovery
                </Button>
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={handleAutoPlay}
                >
                  Auto-Play
                </Button>
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={stopAutoPlay}
                >
                  Stop
                </Button>
              </Box>
            </Box>
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {discoveryPath.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="subtitle2">
                      {step.title} ({new Date(step.date).toLocaleDateString()})
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2">{step.summary}</Typography>
                    {step.url && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <a href={step.url} target="_blank" rel="noopener noreferrer">
                          Read more
                        </a>
                      </Typography>
                    )}
                    <Box sx={{ mb: 2, mt: 1 }}>
                      <div>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={activeStep === discoveryPath.length - 1}
                          endIcon={<NavigateNextIcon />}
                          sx={{ mr: 1 }}
                          size="small"
                        >
                          Next
                        </Button>
                        <Button
                          onClick={handleBack}
                          disabled={activeStep === 0}
                          startIcon={<NavigateBeforeIcon />}
                          sx={{ mr: 1 }}
                          size="small"
                        >
                          Back
                        </Button>
                        {activeStep === discoveryPath.length - 1 && (
                          <Button 
                            onClick={handleReset} 
                            startIcon={<RestartAltIcon />}
                            size="small"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default DiscoveryFlow; 