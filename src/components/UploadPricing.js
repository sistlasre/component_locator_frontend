import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Upload, CloudUpload, CheckCircle } from 'react-bootstrap-icons';
import axios from 'axios';

const UploadPricing = () => {
  const [formData, setFormData] = useState({
    email_address: '',
    mpn_field: '',
    mfr_field: '',
    quantity_requested_field: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous errors when user starts typing
    setError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid CSV file');
      setSelectedFile(null);
    }
  };

  const validateForm = () => {
    if (!formData.email_address) {
      setError('Email address is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_address)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!selectedFile) {
      setError('Please select a CSV file to upload');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMessage('');
    setUploadSuccess(false);

    try {
      // Step 1: Get presigned URL from the API
      const presignedUrlResponse = await axios.post(
        'https://obkg1pw61g.execute-api.us-west-2.amazonaws.com/prod/get-pricing-presigned-url',
        {
          email_address: formData.email_address,
          mpn_field: formData.mpn_field || undefined,
          mfr_field: formData.mfr_field || undefined,
          quantity_requested_field: formData.quantity_requested_field || undefined
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { presigned_url } = presignedUrlResponse.data;

      if (!presigned_url) {
        throw new Error('Failed to get upload URL');
      }

      // Step 2: Upload the CSV file to S3 using the presigned URL
      await axios.put(presigned_url, selectedFile, {
        headers: {
          'Content-Type': 'text/csv'
        }
      });

      // Success!
      setUploadSuccess(true);
      setSuccessMessage('File uploaded successfully! Your pricing data has been submitted for processing. You should receive an email once it is processed and downloadable.');
      
      // Reset form
      setFormData({
        email_address: '',
        mpn_field: '',
        mfr_field: '',
        quantity_requested_field: ''
      });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('csvFile');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.message) {
        setError(`Upload failed: ${err.response.data.message}`);
      } else if (err.message) {
        setError(`Upload failed: ${err.message}`);
      } else {
        setError('An error occurred while uploading the file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h4 className="mb-0 d-flex align-items-center">
                <CloudUpload className="me-2" />
                Upload Pricing Data
              </h4>
            </Card.Header>
            
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                {/* Email Address (Required) */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Email Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email_address"
                    value={formData.email_address}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    disabled={uploading}
                  />
                  <Form.Text className="text-muted">
                    We'll use this email to send you confirmation and updates
                  </Form.Text>
                </Form.Group>

                {/* Optional Key-Value Mappings */}
                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Key-Value Mappings (Optional)</h6>
                  <p className="text-muted small">
                    Provide column mappings for your CSV file if they differ from the default names
                  </p>

                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>MPN Field</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <small>Column:</small>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            name="mpn_field"
                            value={formData.mpn_field}
                            onChange={handleInputChange}
                            placeholder="e.g., part_number"
                            disabled={uploading}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Manufacturer Field</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <small>Column:</small>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            name="mfr_field"
                            value={formData.mfr_field}
                            onChange={handleInputChange}
                            placeholder="e.g., manufacturer_name"
                            disabled={uploading}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Quantity Requested Field</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <small>Column:</small>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            name="quantity_requested_field"
                            value={formData.quantity_requested_field}
                            onChange={handleInputChange}
                            placeholder="e.g., qty_requested"
                            disabled={uploading}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* CSV File Upload */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    CSV File <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="me-2"
                    />
                    {selectedFile && (
                      <CheckCircle className="text-success" size={20} />
                    )}
                  </div>
                  {selectedFile && (
                    <Form.Text className="text-success d-block mt-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Form.Text>
                  )}
                  <Form.Text className="text-muted">
                    Upload a CSV file containing your pricing data
                  </Form.Text>
                </Form.Group>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <span>{error}</span>
                  </Alert>
                )}

                {/* Success Alert */}
                {uploadSuccess && successMessage && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <CheckCircle className="me-2" />
                    <span>{successMessage}</span>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={uploading || !selectedFile || !formData.email_address}
                    className="d-flex align-items-center justify-content-center"
                  >
                    {uploading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="me-2" />
                        Upload Pricing Data
                      </>
                    )}
                  </Button>
                </div>
              </Form>

              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="fw-semibold mb-2">CSV File Requirements:</h6>
                <ul className="small mb-0">
                  <li>File must be in CSV format (.csv)</li>
                  <li>First row should contain column headers</li>
                  <li>Include columns for MPN, Manufacturer, and Quantity as applicable</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UploadPricing;