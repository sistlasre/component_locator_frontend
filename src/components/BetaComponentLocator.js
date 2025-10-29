import React from 'react';
import { Container, Form, Button } from 'react-bootstrap';
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
    <div className="beta-landing d-flex align-items-center justify-content-center">
      <Container className="text-center">
        <h1 className="beta-title mb-3">Search Electronic Components</h1>
        <p className="text-muted mb-4">
          Search millions of electronic components from authorized distributors
        </p>

        <Form onSubmit={handleSearch} className="d-flex justify-content-center">
          <Form.Control
            type="text"
            placeholder="Enter part number or keyword..."
            className="beta-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary" className="beta-search-btn">
            Search
          </Button>
        </Form>

        <div className="beta-footnote mt-4 text-muted small">
          Example: <span className="fw-semibold">XC7A100T-1FTG256C</span>
        </div>
      </Container>
    </div>
  );
};

export default BetaComponentLocator;
