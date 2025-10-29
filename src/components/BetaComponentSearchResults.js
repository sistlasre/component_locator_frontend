import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Button,
  Link,
  Checkbox,
  TextField,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import './BetaStyles.css';

const BetaComponentSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const field = queryParams.get('field') || 'mpn';
  const fieldValue = queryParams.get('field_value') || '';
  const searchType = queryParams.get('search_type') || 'begins_with';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    if (fieldValue && fieldValue.length >= 2) {
      performSearch();
    }
  }, [fieldValue]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.search(field, fieldValue, searchType, 'beta_search');
      const data = res.data?.results || {};
      const combined = [
        ...(data.americas?.inStock || []),
        ...(data.europe?.inStock || []),
        ...(data.asia?.inStock || [])
      ].map(item => JSON.parse(item.item || '{}'));
      setResults(combined);
    } catch (err) {
      console.error(err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriceBreaks = (item) => {
    const breaks = [];
    for (let i = 0; i <= 4; i++) {
      const breakQty = item[`break_qty_${String.fromCharCode(97 + i)}`];
      const price = item[`price_${String.fromCharCode(97 + i)}`];
      if (breakQty && price && price > 0) {
        breaks.push({ qty: breakQty, price: price });
      }
    }
    return breaks;
  };

  const renderPriceColumn = (item) => {
    const breaks = getPriceBreaks(item);
    if (breaks.length === 0) return '—';
    
    return (
      <Box>
        {breaks.slice(0, 3).map((b, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 120 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>{b.qty}</Typography>
            <Typography variant="body2">${b.price.toFixed(4)}</Typography>
          </Box>
        ))}
        {breaks.length > 3 && (
          <Link component="button" variant="body2" sx={{ mt: 0.5 }}>
            See More
          </Link>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header with part number and tabs */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          {fieldValue} <Typography component="span" variant="body1" color="text.secondary">price and stock</Typography>
        </Typography>
        
        <Button variant="contained" size="small" sx={{ mb: 2 }}>
          {fieldValue} Details
        </Button>

      </Box>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress />
          <Typography sx={{ mt: 3, color: 'text.secondary' }}>Loading results...</Typography>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && results.length === 0 && (
        <Alert severity="info">No results found for "{fieldValue}".</Alert>
      )}

      {/* Results Table */}
      {!loading && results.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">Search Results</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Typography variant="body1" color="text.secondary" sx={{ pr: 2 }}>
                  Showing <strong>{results.length}</strong> results
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Part #</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Description / Details</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((item, idx) => {
                  const priceBreaks = getPriceBreaks(item);
                  return (
                    <TableRow 
                      key={idx} 
                      hover
                      sx={{ 
                        bgcolor: idx % 2 === 0 ? 'white' : '#ebf4fa',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        {item.link ? (
                          <Link 
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ color: 'primary.main', fontWeight: 500 }}
                          >
                            {item.part_number}
                          </Link>
                        ) : (
                          <Typography sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {item.part_number}
                          </Typography>
                        )}
                        {item.supplier_code && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            DISTI # {item.supplier_code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.supplier_name && (
                          <Box>
                            <Typography variant="body2">{item.supplier_name}</Typography>
                            {item.country && (
                              <Typography variant="caption" color="text.secondary">
                                {item.country}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{item.mfr || '—'}</TableCell>
                      <TableCell>
                        {item.description && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {item.description}
                          </Typography>
                        )}
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {[
                              item.dc && `Date Code: ${item.dc}`,
                            ].filter(Boolean).join(' | ')}
                          </Typography>
                        </Box>
                        {item.link && (
                          <Box sx={{ mt: 1 }}>
                            <Link href={item.link} target="_blank" variant="body2">
                              {item.part_number} Part Details
                            </Link>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight="medium">
                          {item.qty || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {renderPriceColumn(item)}
                      </TableCell>
                      <TableCell align="center">
                        {item.link && (
                          <Button 
                            variant="contained" 
                            color="success"
                            size="small"
                            href={item.link}
                            target="_blank"
                            sx={{ 
                              bgcolor: '#8BC34A',
                              '&:hover': { bgcolor: '#7CB342' }
                            }}
                          >
                            Buy Now
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default BetaComponentSearchResults;
