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

        {/* Distributor tabs */}
        <Tabs value={1} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label={`My Preferred Distributors (0)`} />
          <Tab label={`All Results (${results.length})`} />
        </Tabs>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <Typography variant="body2" sx={{ mb: 1 }}>Desired Stock:</Typography>
            <TextField 
              size="small" 
              placeholder="eg. 20000" 
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox size="small" />
              <Typography variant="body2">In Stock Only</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox size="small" />
              <Typography variant="body2">Exact Matches Only</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" sx={{ mb: 1 }}>Currency Estimator:</Typography>
            <Select size="small" fullWidth defaultValue="Default">
              <MenuItem value="Default">Default</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" sx={{ mb: 1 }}>Filter by Manufacturer:</Typography>
            <Select size="small" fullWidth defaultValue="">
              <MenuItem value="">Select Manufacturer</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth>
              Set Alert
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
            <Grid container alignItems="center">
              <Grid item xs>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Search Results</Typography>
                  <Chip label="Multiple Distributors" size="small" color="primary" />
                </Box>
              </Grid>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  Showing {results.length} results
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
                    <TableRow key={idx} hover>
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
                        {item.rohs && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            <Typography variant="body2">
                              RoHS: <Chip label="Compliant" size="small" color="success" sx={{ height: 20 }} />
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {[
                              item.min_qty && `Min Qty: ${item.min_qty}`,
                              item.package_multiple && `Package Multiple: ${item.package_multiple}`,
                              item.dc && `DC: ${item.dc}`,
                              item.date_code && `Date Code: ${item.date_code}`,
                              item.container && `Container: ${item.container}`
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
