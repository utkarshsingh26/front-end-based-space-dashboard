import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Papa from 'papaparse';
import Map from './Map';
import DiscoveryFlow from './DiscoveryFlow';
import vectorDbService from '../services/api';

function SearchBox() {
    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [finalResult, setFinalResult] = useState([]);
    const [relatedKeywords, setRelatedKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const mapRef = useRef(null);

    // Function to handle search using vector database
    async function handleVectorSearch() {
        try {
            setLoading(true);
            setError(null);
            
            const formattedStartDate = startDate ? startDate.format('MM-DD-YYYY') : null;
            const formattedEndDate = endDate ? endDate.format('MM-DD-YYYY') : null;
            
            // Search for events using the vector database
            const results = await vectorDbService.searchEvents(
                keyword, 
                formattedStartDate, 
                formattedEndDate
            );
            
            setFinalResult(results);
            
            // Get related keywords
            const keywords = await vectorDbService.getRelatedKeywords(keyword);
            setRelatedKeywords(keywords);
        } catch (error) {
            console.error('Error performing vector search:', error);
            setError('Failed to perform search. Please try again.');
            
            // Fallback to CSV search if vector search fails
            handleCsvSearch();
        } finally {
            setLoading(false);
        }
    }

    // Original CSV search as fallback
    function handleCsvSearch() {
        const formattedStartDate = startDate ? startDate.format('MM-DD-YYYY') : 'Not selected';
        const formattedEndDate = endDate ? endDate.format('MM-DD-YYYY') : 'Not selected';
        console.log(keyword, formattedStartDate, formattedEndDate);
        loadCSV(keyword, formattedStartDate, formattedEndDate);
    }

    // Handle click on a related keyword chip
    function handleKeywordClick(relatedKeyword) {
        setKeyword(relatedKeyword);
        // Trigger search with the new keyword
        setTimeout(() => {
            handleVectorSearch();
        }, 100);
    }

    // Handle location selection from the discovery flow
    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
    };

    function loadCSV(keyword, from, to) {
        // const csvUrl = new URL('./spaceheatmap_data_f47.csv', import.meta.url); 
        const csvUrl = new URL('../dataset/dataset.csv', import.meta.url); 
        fetch(csvUrl)
            .then(response => response.text())
            .then(csvString => {
                Papa.parse(csvString, {
                    header: true,
                    complete: results => {
                        let csv = results.data;
    
                        
                        const filteredResults = csv.filter(item => {
                            
                            const containsKeyword = Object.values(item).some(value => 
                                value && value.toString().toLowerCase().includes(keyword.toLowerCase())
                            );
    
                            
                            const isWithinDateRange = new Date(item.date) >= new Date(from) &&
                                                      new Date(item.date) <= new Date(to);
    
                            
                            return containsKeyword && isWithinDateRange;
                        });
    
                        setFinalResult(filteredResults); 
                        console.log(filteredResults); 
                    }
                });
            })
            .catch(error => console.error('Error fetching or parsing CSV:', error));
    }
    

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100vh',
                    position: 'relative'
                }}
            >
                {/* Search controls positioned absolutely on top of the map */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 20,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            padding: 2,
                            borderRadius: 2,
                            boxShadow: 3,
                        }}
                    >
                        <TextField 
                            id="outlined-basic" 
                            label="Keyword" 
                            variant="outlined" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            sx={{ backgroundColor: 'white' }}
                        />
                        <DatePicker 
                            label="Start Date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e)}
                            sx={{ backgroundColor: 'white' }}
                        />
                        <DatePicker 
                            label="End Date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e)}
                            sx={{ backgroundColor: 'white' }}
                        />
                        <Button 
                            variant="contained" 
                            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                            onClick={handleVectorSearch}
                            disabled={loading || !keyword}
                        >
                            Search
                        </Button>
                    </Box>
                    
                    {/* Related keywords */}
                    {relatedKeywords.length > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                padding: 2,
                                borderRadius: 2,
                                boxShadow: 3,
                                maxWidth: '80%',
                            }}
                        >
                            <Typography variant="subtitle1" gutterBottom>
                                Related Keywords:
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    justifyContent: 'center',
                                }}
                            >
                                {relatedKeywords.map((relatedKeyword, index) => (
                                    <Chip
                                        key={index}
                                        label={relatedKeyword}
                                        onClick={() => handleKeywordClick(relatedKeyword)}
                                        color="primary"
                                        variant="outlined"
                                        clickable
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                    
                    {/* Error message */}
                    {error && (
                        <Box
                            sx={{
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                color: 'error.main',
                                padding: 1,
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="body2">{error}</Typography>
                        </Box>
                    )}
                </Box>

                {/* Map takes up the full container */}
                <Box sx={{ width: '100%', height: '100%' }}>
                    <Map 
                        ref={mapRef}
                        markers={finalResult} 
                        selectedLocation={selectedLocation}
                        onMapReady={(map) => console.log('Map is ready')}
                    />
                </Box>
                
                {/* Discovery Flow component */}
                <DiscoveryFlow 
                    onSelectLocation={handleSelectLocation} 
                    mapRef={mapRef}
                />
            </Box>
        </LocalizationProvider>
    );
}

export default SearchBox;
