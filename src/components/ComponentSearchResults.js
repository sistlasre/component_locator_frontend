import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortAsc, faSortDesc, faArrowLeft, faExternalLinkAlt, faChevronDown, faChevronRight, faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons';
import ComponentSearchBar from './ComponentSearchBar';
import SupplierModal from './SupplierModal';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ComponentSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {user} = useAuth();
  const [totalResults, setTotalResults] = useState(0);
  const [regionResults, setRegionResults] = useState({
    americas: { inStock: [], brokered: [] },
    europe: { inStock: [], brokered: [] },
    asia: { inStock: [], brokered: [] }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [subscribing, setSubscribing] = useState({});
  const [unsubscribing, setUnsubscribing] = useState({});

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const searchType = queryParams.get('search_type') || 'begins_with';
  const field = queryParams.get('field') || 'mpn';
  const fieldValue = queryParams.get('field_value') || '';

  // Fetch user subscriptions when component mounts
  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  // Perform search when component mounts or query params change
  useEffect(() => {
    if (fieldValue && fieldValue.length >= 3) {
      performSearch();
    }
  }, [location.search]);

  const fetchSubscriptions = async () => {
    try {
      const response = await apiService.getSubscriptions(user);
      setUserSubscriptions(response.data.subscribedParts || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.search(field, fieldValue, searchType, 'search_page');
      const data = response.data;

      // Set total results count
      setTotalResults(data.numResults || 0);

      // Process regional results
      const processedRegions = {};
      const regions = ['americas', 'europe', 'asia'];

      for (const region of regions) {
        processedRegions[region] = {
          inStock: [],
          brokered: []
        };

        if (data.results && data.results[region]) {
          // Parse inStock items for this region
          if (data.results[region].inStock) {
            processedRegions[region].inStock = data.results[region].inStock.map(item => {
              try {
                return JSON.parse(item.item);
              } catch (e) {
                console.error(`Error parsing ${region} inStock item:`, e);
                return null;
              }
            }).filter(item => item !== null);
          }

          // Parse brokered items for this region
          if (data.results[region].brokered) {
            processedRegions[region].brokered = data.results[region].brokered.map(item => {
              try {
                return JSON.parse(item.item);
              } catch (e) {
                console.error(`Error parsing ${region} brokered item:`, e);
                return null;
              }
            }).filter(item => item !== null);
          }
        }
      }

      setRegionResults(processedRegions);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
      setRegionResults({
        americas: { inStock: [], brokered: [] },
        europe: { inStock: [], brokered: [] },
        asia: { inStock: [], brokered: [] }
      });
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (newValue, newSearchType, newField) => {
    const params = new URLSearchParams({
      search_type: newSearchType,
      field: newField,
      field_value: newValue
    });
    navigate(`/search?${params.toString()}`);
  };

  const sortItems = (items, key, direction) => {
    return [...items].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle numeric values
      if (key === 'qty') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key, region) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const updatedRegions = { ...regionResults };
    if (updatedRegions[region]) {
      updatedRegions[region].inStock = sortItems(updatedRegions[region].inStock, key, direction);
      updatedRegions[region].brokered = sortItems(updatedRegions[region].brokered, key, direction);
    }

    setSortConfig({ key, direction });
    setRegionResults(updatedRegions);
  };

  const formatQuantity = (qty) => {
    return qty > 0 ? qty.toLocaleString() : '-';
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FontAwesomeIcon icon={faSort} className="ms-1" style={{ opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortAsc} className="ms-1" />
      : <FontAwesomeIcon icon={faSortDesc} className="ms-1" />;
  };

  const handleSupplierClick = (supplierId, item) => {
    setSelectedSupplierId(supplierId);
    setSelectedItem(item);
    setShowSupplierModal(true);
  };

  const handleCloseSupplierModal = () => {
    setShowSupplierModal(false);
    setSelectedSupplierId(null);
    setSelectedItem(null);
  };

  const handleSubscribe = async (partNumber) => {
    setSubscribing(prev => ({ ...prev, [partNumber]: true }));
    try {
      await apiService.subscribe(partNumber, user);
      setUserSubscriptions(prev => [...prev, partNumber]);
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(`Failed to subscribe to ${partNumber}. Please try again.`);
    } finally {
      setSubscribing(prev => ({ ...prev, [partNumber]: false }));
    }
  };

  const handleUnsubscribe = async (partNumber) => {
    setUnsubscribing(prev => ({ ...prev, [partNumber]: true }));
    try {
      await apiService.unsubscribe(partNumber, user);
      setUserSubscriptions(prev => prev.filter(part => part !== partNumber));
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(`Failed to unsubscribe from ${partNumber}. Please try again.`);
    } finally {
      setUnsubscribing(prev => ({ ...prev, [partNumber]: false }));
    }
  };

  const renderSubscriptionButton = (partNumber) => {
    const isSubscribed = userSubscriptions.includes(partNumber);
    const isProcessing = subscribing[partNumber] || unsubscribing[partNumber];

    return (
      <Button
        className="btn-xs"
        variant={isSubscribed ? "outline-secondary" : "outline-primary"}
        onClick={(e) => {
          e.stopPropagation();
          isSubscribed ? handleUnsubscribe(partNumber) : handleSubscribe(partNumber);
        }}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Spinner as="span" animation="border" size="sm" />
        ) : (
          <>
            <FontAwesomeIcon icon={isSubscribed ? faBellSlash : faBell} className="me-1" />
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </>
        )}
      </Button>
    );
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Get unique part numbers from results
  const getUniquePartNumbers = (items) => {
    return [...new Set(items.map(item => item.part_number))];
  };

  // Render inventory table for a region
  const renderRegionTable = (items, region, type) => {
    if (!items || items.length === 0) return null;

    return (
      <div style={{ overflowX: 'auto' }}>
        <Table hover className="mb-0" size="sm" style={{ fontSize: '0.9rem' }}>
          <thead style={{ backgroundColor: '#e8f4ff' }}>
            <tr>
              <th onClick={() => handleSort('part_number', region)} style={{ cursor: 'pointer', minWidth: '120px' }}>
                Part Number {getSortIcon('part_number')}
              </th>
              <th onClick={() => handleSort('mfr', region)} style={{ minWidth: '80px' }}>
                Mfr {getSortIcon('mfr')}
              </th>
              <th onClick={() => handleSort('dc', region)} style={{ cursor: 'pointer', width: '60px' }}>
                DC {getSortIcon('dc')}
              </th>
              <th style={{ minWidth: '200px' }}>Description</th>
              <th style={{ width: '90px' }}>Uploaded</th>
              <th style={{ width: '60px' }}>Ctr</th>
              <th onClick={() => handleSort('qty', region)} style={{ cursor: 'pointer', width: '80px' }}>
                Qty {getSortIcon('qty')}
              </th>
              <th style={{ minWidth: '150px' }}>Supplier</th>
              {user && <th>Subscription</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${region}-${type}-${index}`} className="ic-smaller">
                <td>{item.part_number}</td>
                <td>{item.mfr && item.mfr.toLowerCase() !== 'nan' ? item.mfr : '-'}</td>
                <td>
                  {item.dc && item.dc.toLowerCase() !== 'nan' ? (
                    <span>{item.dc}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {item.description && item.description.toLowerCase() !== 'nan' ? (
                    <small title={item.description} className="text-muted">
                        {item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description}
                    </small>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  {item.processed_at ?
                    user ?
                      new Date(item.processed_at).toLocaleDateString()
                      : new Date(item.processed_at).toLocaleDateString().replace(/\d/g, '*')
                    : '-'
                  }
                </td>
                <td>
                  {item.country ?
                    user ? item.country : '**'
                    : '-'
                  }
                </td>
                <td>
                  {item.qty || '-'}
                </td>
                <td>
                  {user ? (
                    <span 
                      onClick={() => handleSupplierClick(item.supplier_id, item)}
                      style={{ 
                        cursor: 'pointer', 
                        color: '#0d6efd',
                        textDecoration: 'underline'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      {item.supplier_name}
                    </span>
                  ) : (
                    '******'
                  )}
                </td>
                {user && (
                  <td>
                    {renderSubscriptionButton(item.part_number)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  // Render a complete regional section
  const renderRegionalSection = (regionKey, regionTitle) => {
    const region = regionResults[regionKey];
    const hasResults = (region.inStock && region.inStock.length > 0) || 
                      (region.brokered && region.brokered.length > 0);

    if (!hasResults) return null;

    const sectionKey = `${regionKey}-section`;
    const isExpanded = expandedSections[sectionKey] !== false; // Default to expanded

    return (
      <Card className="mb-3">
        <Card.Header 
          onClick={() => toggleSection(sectionKey)}
          style={{ 
            cursor: 'pointer', 
            backgroundColor: '#f8f9fa',
            padding: '0.75rem 1rem'
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronRight} 
                className="me-2" 
                style={{ fontSize: '0.9em' }}
              />
              {regionTitle}
            </h5>
            <div>
              {region.inStock.length > 0 && (
                <Badge bg="success" className="me-2">
                  In Stock: {region.inStock.length}
                </Badge>
              )}
              {region.brokered.length > 0 && (
                <Badge bg="info">
                  Brokered: {region.brokered.length}
                </Badge>
              )}
            </div>
          </div>
        </Card.Header>
        {isExpanded && (
          <Card.Body className="p-0">
            {region.inStock.length > 0 && (
              <div>
                <div style={{ backgroundColor: '#d4edda', padding: '0.2rem 1rem' }}>
                  <strong style={{ color: '#155724' }}>In Stock Inventory</strong>
                </div>
                {renderRegionTable(region.inStock, regionKey, 'instock')}
              </div>
            )}
            {region.brokered.length > 0 && (
              <div>
                <div style={{ backgroundColor: '#d1ecf1', padding: '0.2rem 1rem' }}>
                  <strong style={{ color: '#0c5460' }}>Brokered Inventory</strong>
                </div>
                {renderRegionTable(region.brokered, regionKey, 'brokered')}
              </div>
            )}
          </Card.Body>
        )}
      </Card>
    );
  };

  // Check if there are any results
  const hasAnyResults = () => {
    return Object.values(regionResults).some(region => 
      (region.inStock && region.inStock.length > 0) || 
      (region.brokered && region.brokered.length > 0)
    );
  };

  return (
    <Container fluid className="py-3">
      <Row className="mb-2">
        <Col>
          <h2 className="mb-2">Components Located:</h2>

          <Card className="shadow-sm">
            <Card.Body>
              <ComponentSearchBar 
                showDropdown={true}
                onSearch={handleNewSearch}
                initialValue={fieldValue}
                searchType={searchType}
                field={field}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading && (
        <Row>
          <Col className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3" />
            <p>Searching for parts...</p>
          </Col>
        </Row>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && !error && !hasAnyResults() && fieldValue && (
        <Alert variant="info">
          No results found for "{fieldValue}". Try adjusting your search criteria.
        </Alert>
      )}

      {!loading && hasAnyResults() && (
        <>
          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Search Results</h4>
                  <p className="text-muted mb-0">
                    {totalResults} line item{totalResults !== 1 ? 's' : ''} found for "{fieldValue}"
                  </p>
                </div>
                <Badge bg="secondary" style={{ height: 'fit-content' }}>
                  {field.toUpperCase()} - {searchType.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </Col>
          </Row>

          {/* Regional Sections */}
          {renderRegionalSection('americas', 'The Americas')}
          {renderRegionalSection('europe', 'Europe')}
          {renderRegionalSection('asia', 'Asia')}
        </>
      )}

      <SupplierModal 
        show={showSupplierModal}
        onHide={handleCloseSupplierModal}
        supplierId={selectedSupplierId}
        selectedItem={selectedItem}
      />
    </Container>
  );
};

export default ComponentSearchResults;
