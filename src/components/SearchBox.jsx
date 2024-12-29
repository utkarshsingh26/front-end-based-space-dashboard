import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';

function SearchBox() {

    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    function handleClick(){
        const formattedStartDate = startDate ? startDate.format('MM-DD-YYYY') : 'Not selected';
        const formattedEndDate = endDate ? endDate.format('MM-DD-YYYY') : 'Not selected';
        console.log(keyword, formattedStartDate, formattedEndDate)
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
                    <TextField id="outlined-basic" label="Keyword" variant="outlined" onChange={(e) =>setKeyword(e.target.value)} />
                    <DatePicker label="Start Date" onChange={(e) => setStartDate(e)} />
                    <DatePicker label="End Date" onChange={(e) => setEndDate(e)} />
                </Box>
                <Button variant="contained" endIcon={<SendIcon /> } onClick={handleClick}>
                    Send
                </Button>
            </Box>
        </LocalizationProvider>
    );
}

export default SearchBox;
