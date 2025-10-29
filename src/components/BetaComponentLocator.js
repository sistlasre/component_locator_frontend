import React from 'react';
import { Container, Box, TextField, Button, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import './BetaStyles.css';

const BetaComponentLocator = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      navigate(
        `/beta-search?field=mpn&field_value=${encodeURIComponent(searchTerm)}&search_type=begins_with`
      );
    }
  };

  return (
    <Box className="beta-landing" sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '85vh'
    }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h1" className="beta-title" sx={{ mb: 2, fontWeight: 600 }}>
            Search Electronic Components
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Search millions of electronic components from authorized distributors
          </Typography>

          <Box component="form" onSubmit={handleSearch} sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: 1
          }}>
            <TextField
              placeholder="Enter part number or keyword..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                maxWidth: 600,
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                  paddingLeft: 1
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<SearchIcon />}
              sx={{
                borderRadius: '50px',
                px: 3,
                textTransform: 'none'
              }}
            >
              Search
            </Button>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            className="beta-footnote"
            sx={{ mt: 4 }}
          >
            Example: <Box component="span" sx={{ fontWeight: 600 }}>XC7A100T-1FTG256C</Box>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default BetaComponentLocator;
