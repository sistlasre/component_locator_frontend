import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortAsc, faSortDesc, faArrowLeft, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import ComponentSearchBar from './ComponentSearchBar';
import SupplierModal from './SupplierModal';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ComponentSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {user} = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const searchType = queryParams.get('search_type') || 'begins_with';
  const field = queryParams.get('field') || 'mpn';
  const fieldValue = queryParams.get('field_value') || '';

  // Perform search when component mounts or query params change
  useEffect(() => {
    if (fieldValue && fieldValue.length >= 3) {
      performSearch();
    }
  }, [location.search]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.search(field, fieldValue, searchType, 'search_page');
      const data = response.data;

      if (data.items) {
        // Parse the item strings
        const parsedItems = data.items.map(item => {
          try {
            return JSON.parse(item.item);
          } catch (e) {
            console.error('Error parsing item:', e);
            return null;
          }
        }).filter(item => item !== null);

        setResults(parsedItems);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
      setResults([]);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sorted = [...results].sort((a, b) => {
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

    setSortConfig({ key, direction });
    setResults(sorted);
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

      {!loading && !error && results.length === 0 && fieldValue && (
        <Alert variant="info">
          No results found for "{fieldValue}". Try adjusting your search criteria.
        </Alert>
      )}

      {!loading && results.length > 0 && (
        <>

          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <h5>
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{fieldValue}"
                </h5>
                <Badge bg="secondary">{field.toUpperCase()} - {searchType.replace('_', ' ').toUpperCase()}</Badge>
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Body style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <Table striped hover className="mb-0">
                      <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr className="no-padding">
                          <th onClick={() => handleSort('part_number')} style={{ cursor: 'pointer' }}>
                            Part Number {getSortIcon('part_number')}
                          </th>
                          <th onClick={() => handleSort('mfr')} style={{ cursor: 'pointer' }}>
                            Manufacturer {getSortIcon('mfr')}
                          </th>
                          <th onClick={() => handleSort('dc')} style={{ cursor: 'pointer' }}>
                            Date Code {getSortIcon('dc')}
                          </th>
                          <th>Description</th>
                          <th>Uploaded</th>
                          <th>Country</th>
                          <th onClick={() => handleSort('qty')} style={{ cursor: 'pointer' }}>
                            Quantity {getSortIcon('qty')}
                          </th>
                          <th>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item, index) => (
                          <tr key={index} className="ic-small">
                            <td className="fw-bold">{item.part_number}</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

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
