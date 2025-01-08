import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Papa from 'papaparse';
import Map from './Map'; // Import the Map component

function SearchBox() {

    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [finalResult, setFinalResult] = useState([]);

    function handleClick(){
        const formattedStartDate = startDate ? startDate.format('MM-DD-YYYY') : 'Not selected';
        const formattedEndDate = endDate ? endDate.format('MM-DD-YYYY') : 'Not selected';
        console.log(keyword, formattedStartDate, formattedEndDate);
        loadCSV(keyword, formattedStartDate, formattedEndDate);
    }

    // function loadCSV(keyword, from, to) {
    //     const csvUrl = new URL('./spaceheatmap_data_f47.csv', import.meta.url); 
    //     fetch(csvUrl)
    //       .then(response => response.text())
    //       .then(csvString => {
    //         Papa.parse(csvString, {
    //           header: true,
    //           complete: results => {
    //             let csv = results.data;
    //             const filteredResults = csv.filter(item => 
    //               item.locations === keyword && 
    //               new Date(item.date) >= new Date(from) && 
    //               new Date(item.date) <= new Date(to)
    //             );
    //             setFinalResult(filteredResults); // Update state with filtered results
    //             console.log(filteredResults); // Log the filtered results
    //           }
    //         });
    //       })
    //       .catch(error => console.error('Error fetching or parsing CSV:', error));
    // }

    function loadCSV(keyword, from, to) {
        // const csvUrl = new URL('./spaceheatmap_data_f47.csv', import.meta.url); 
        const csvUrl = new URL('./improving.csv', import.meta.url); 
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
                component="form"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2, 
                }}
                noValidate
                autoComplete="off"
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2,
                    }}
                >
                    <TextField id="outlined-basic" label="Keyword" variant="outlined" onChange={(e) => setKeyword(e.target.value)} />
                    <DatePicker label="Start Date" onChange={(e) => setStartDate(e)} />
                    <DatePicker label="End Date" onChange={(e) => setEndDate(e)} />
                </Box>
                <Button variant="contained" endIcon={<SendIcon />} onClick={handleClick}>
                    Send
                </Button>

                {/* Pass finalResult as a prop to Map */}
                <Map markers={finalResult} />
            </Box>
        </LocalizationProvider>
    );
}

export default SearchBox;
