import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import countryList from '../country_list.json';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const SupplierRegistration = () => {
  const navigate = useNavigate();
  const countryOptions = countryList.map((c) => ({ value: c.country_code, label: c.country }));

  const [formData, setFormData] = useState({
    companyName: '',
    phoneNumber: '',
    website: '',
    address: '',
    description: '',
    contactEmail: '',
    emailForUpload: '',
    country: '',
    password: '',
    inStockFileName: '',
    brokeredFileName: ''
  });

  const [mappings, setMappings] = useState({
    'Part Number': '',
    'Manufacturer': '',
    'Datecode': '',
    'Description': '',
    'Quantity': '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMappingChange = (key, value) => {
    setMappings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.companyName || !formData.contactEmail) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      // Filter out empty fields from formData
      const filteredFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value && value.trim() !== '')
      );

      // Filter out empty mappings
      const filteredMappings = Object.fromEntries(
        Object.entries(mappings).filter(([_, value]) => value && value.trim() !== '')
      );

      const payload = {
        ...filteredFormData,
      };

      // Only include mappings if any exist
      if (Object.keys(filteredMappings).length > 0) {
        payload.fieldMappings = filteredMappings;
      }

      const response = await apiService.createSupplier(payload);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      setSuccess(true);
      setFormData({
        companyName: '',
        phoneNumber: '',
        website: '',
        address: '',
        description: '',
        contactEmail: '',
        emailForUpload: '',
      });
      setMappings({
        'Part Number': '',
        'Manufacturer': '',
        'Datecode': '',
        'Description': '',
        'Quantity': ''
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Please try again.';
      setError('Failed to register supplier. ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="py-3">
      <Row className="justify-content-center">
        <Col xs={12} md={10}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="mb-3">Supplier Registration</h2>
                <p className="text-muted">
                  Provide your company details and mapping information to register as a supplier.
                </p>
              </div>

              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                  Supplier registered successfully!
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Supplier Info */}
                <Form.Group className="mb-3" controlId="companyName">
                  <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="contactEmail">
                  <Form.Label>Contact Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="phoneNumber">
                  <Form.Label>Telephone Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="website">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="address">
                  <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="country">
                  <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                  <Select
                    name="country"
                    options={countryOptions}
                    value={countryOptions.find((c) => c.value === formData.country) || null}
                    onChange={(selectedOption) =>
                      setFormData((prev) => ({
                        ...prev,
                        country: selectedOption ? selectedOption.value : '',
                      }))
                    }
                    placeholder="Select a country"
                    isClearable
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="emailForUpload">
                  <Form.Label>Email for Uploads <span className="fst-italic text-muted small">(if different than contact email)</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="emailForUpload"
                    value={formData.emailForUpload}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Inventory Listing Filenames */}
                <hr />
                <h5 className="mt-4 mb-3">Inventory Listing Filenames</h5>
                <p className="text-muted small mb-4">
                  Provide the file name that corresponds to your in stock inventory and brokered inventory uploads.
                  If nothing provided, we will fall back to our defaults.
                </p>

                <Form.Group className="mb-4" controlId="inStockFileName">
                  <Form.Label>In Stock Inventory File Name <span className="fst-italic text-muted small">(no extension)</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="inStockFileName"
                    value={formData.inStockFileName}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="brokeredFileName">
                  <Form.Label>Brokered Inventory File Name <span className="fst-italic text-muted small">(no extension)</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="brokeredFileName"
                    value={formData.brokeredFileName}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Data Field Mappings */}
                <hr />
                <h5 className="mt-4 mb-3">Data Field Mappings</h5>
                <p className="text-muted small mb-4">
                  Map your column names to our system’s standard fields.  
                  If a mapping is left blank, we’ll assume your column name matches ours exactly.
                </p>

                {Object.keys(mappings).map((key) => (
                  <Form.Group className="mb-3" controlId={`map-${key}`} key={key}>
                    <Form.Label>{key}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={`Enter your column name for "${key}" (optional)`}
                      value={mappings[key]}
                      onChange={(e) => handleMappingChange(key, e.target.value)}
                    />
                  </Form.Group>
                ))}

                <div className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    disabled={submitting}
                  >
                    Back
                  </Button>

                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Register Supplier'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SupplierRegistration;

