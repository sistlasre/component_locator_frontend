import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Form,
  Table,
  Badge
} from 'react-bootstrap';
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

  const renderPricingTable = (item) => {
    const breaks = [];
    for (let i = 0; i <= 4; i++) {
      const breakQty = item[`break_qty_${String.fromCharCode(97 + i)}`];
      const price = item[`price_${String.fromCharCode(97 + i)}`];
      if (breakQty && price && price > 0) {
        breaks.push({ breakQty, price });
      }
    }

    if (breaks.length === 0) return null;

    return (
      <Table striped bordered hover size="sm" className="mt-2 beta-price-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Price (USD)</th>
          </tr>
        </thead>
        <tbody>
          {breaks.map((b, idx) => (
            <tr key={idx}>
              <td>{b.breakQty}</td>
              <td>${b.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderDistributorBadge = (item) => (
    <div className="beta-distributor d-flex align-items-center mt-2">
      <div className="beta-dist-logo me-2"></div>
      <div>
        <div className="fw-semibold">{item.supplier_name}</div>
        <div className="text-muted small">{item.country || '—'}</div>
      </div>
    </div>
  );

  return (
    <Container fluid className="py-3 beta-results-page">
      <Row>
        {/* Left Filters */}
        <Col md={3} className="beta-filter-panel">
          <h6 className="text-uppercase text-muted mb-3">Filters</h6>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Region</Form.Label>
              <Form.Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option>All</option>
                <option>Americas</option>
                <option>Europe</option>
                <option>Asia</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Col>

        {/* Right Results */}
        <Col md={9}>
          <h4 className="mb-3">
            Search results for <span className="text-primary">“{fieldValue}”</span>
          </h4>

          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3 text-muted">Loading results...</p>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && results.length === 0 && (
            <Alert variant="info">No results found for “{fieldValue}”.</Alert>
          )}

          {!loading && results.length > 0 && (
            <div className="beta-results-list">
              {results.map((item, idx) => (
                <Card key={idx} className="mb-3 beta-result-card shadow-sm">
                  <Card.Body>
                    <Row>
                      <Col
                        md={2}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div className="beta-image-placeholder" />
                      </Col>

                      <Col md={7}>
                        <h6 className="mb-1">
                          <a
                            href={item.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="beta-part-link"
                          >
                            {item.part_number}
                          </a>
                        </h6>
                        <div className="text-muted small mb-1">
                          {item.mfr || '-'} • DC {item.dc || '-'}
                        </div>
                        <div className="text-muted small">
                          {item.description || 'No description available.'}
                        </div>
                        {renderDistributorBadge(item)}
                      </Col>

                      <Col md={3} className="text-md-end mt-3 mt-md-0">
                        <Badge bg="secondary" className="mb-2">
                          Qty: {item.qty || '-'}
                        </Badge>
                        {renderPricingTable(item)}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default BetaComponentSearchResults;
