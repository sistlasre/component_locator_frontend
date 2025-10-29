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
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon,
  AccountTree as AccountTreeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
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
  const [viewMode, setViewMode] = useState('byPart');
  const [expandedSuppliers, setExpandedSuppliers] = useState({});

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

  // Group results by part number
  const groupByPartNumber = () => {
    const grouped = {};
    results.forEach(item => {
      if (!grouped[item.part_number]) {
        grouped[item.part_number] = {};
      }
      const supplier = item.supplier_name || 'Unknown Supplier';
      if (!grouped[item.part_number][supplier]) {
        grouped[item.part_number][supplier] = [];
      }
      grouped[item.part_number][supplier].push(item);
    });
    return grouped;
  };

  // Group results by supplier
  const groupBySupplier = () => {
    const grouped = {};
    results.forEach(item => {
      const supplier = item.supplier_name || 'Unknown Supplier';
      if (!grouped[supplier]) {
        grouped[supplier] = [];
      }
      grouped[supplier].push(item);
    });
    return grouped;
  };

  const toggleSupplierExpansion = (partNumber, supplier) => {
    const key = `${partNumber}-${supplier}`;
    setExpandedSuppliers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

      {/* View Mode Toggle */}
      {!loading && results.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="byPart">
              <ViewModuleIcon sx={{ mr: 1 }} />
              Part View
            </ToggleButton>
            <ToggleButton value="bySupplier">
              <AccountTreeIcon sx={{ mr: 1 }} />
              Supplier View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* View 2: Group by Part Number */}
      {!loading && results.length > 0 && viewMode === 'byPart' && (
        <Box>
          {Object.entries(groupByPartNumber()).map(([partNumber, suppliers]) => (
            <Paper key={partNumber} sx={{ mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">{partNumber}</Typography>
              </Box>

              {Object.entries(suppliers).map(([supplierName, items]) => {
                const key = `${partNumber}-${supplierName}`;
                const isExpanded = expandedSuppliers[key];
                const displayItems = isExpanded ? items : [items[0]];

                return (
                  <Box key={supplierName} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {supplierName}
                            {items[0].country && (
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({items[0].country})
                              </Typography>
                            )}
                          </Typography>
                        </Grid>
                        {items.length > 1 && (
                          <Grid item>
                            <Button
                              size="small"
                              onClick={() => toggleSupplierExpansion(partNumber, supplierName)}
                              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                              {isExpanded ? 'Show Less' : `Show More (${items.length} items)`}
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Manufacturer</TableCell>
                            <TableCell>Description / Details</TableCell>
                            <TableCell align="center">Stock</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.mfr && item.mfr.toLowerCase() !== 'nan' ? item.mfr : '-'}</TableCell>
                              <TableCell>
                                {item.description && item.description.toLowerCase() !== 'nan' && (
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
                                      item.dc && item.dc.toLowerCase() !== 'nan' && `Date Code: ${item.dc}`,
                                    ].filter(Boolean).join(' | ')}
                                  </Typography>
                                </Box>
                                {item.link && (
                                  <Box sx={{ mt: 1 }}>
                                    <Link href={item.link} target="_blank" variant="body2">
                                      Part Details
                                    </Link>
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body1" fontWeight="medium">
                                  {item.qty || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>{renderPriceColumn(item)}</TableCell>
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
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </Paper>
          ))}
        </Box>
      )}

      {/* View 3: Group by Supplier */}
      {!loading && results.length > 0 && viewMode === 'bySupplier' && (
        <Box>
          {Object.entries(groupBySupplier()).map(([supplierName, items]) => (
            <Paper key={supplierName} sx={{ mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid item>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">{supplierName}</Typography>
                      {items[0]?.country && (
                        <Chip label={items[0].country} size="small" color="primary" />
                      )}
                    </Box>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" color="text.secondary">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Part #</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>Description / Details</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow 
                        key={idx}
                        hover
                        sx={{ 
                          bgcolor: idx % 2 === 0 ? 'white' : 'grey.50',
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
                        <TableCell>{item.mfr && item.mfr.toLowerCase() !== 'nan' ? item.mfr : '-'}</TableCell>
                        <TableCell>
                          {item.description && item.description.toLowerCase() !== 'nan' && (
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
                                item.dc && item.dc.toLowerCase() !== 'nan' && `Date Code: ${item.dc}`,
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
                        <TableCell>{renderPriceColumn(item)}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default BetaComponentSearchResults;
