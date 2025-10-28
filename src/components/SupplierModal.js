import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Alert, Card, Row, Col, Table } from 'react-bootstrap';
import { apiService } from '../services/apiService';

const SupplierModal = ({ show, onHide, supplierId, selectedItem }) => {
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!supplierId || !show) return;

      setLoading(true);
      setError('');

      try {
        const response = await apiService.getSupplierDetails(supplierId);
        const data = response.data;
        
        if (data.supplier && data.supplier.supplier_info) {
          setSupplierInfo(data.supplier.supplier_info);
        } else {
          setError('Supplier information not available');
        }
      } catch (error) {
        console.error('Failed to fetch supplier details:', error);
        setError('Failed to load supplier details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierDetails();
  }, [supplierId, show]);

  const renderSelectedItem = () => {
    if (!selectedItem) return null;

    return (
      <Card className="mb-3">
        <Card.Body className="p-2">
          <h4 className="mb-3">Selected Part</h4>
          <div style={{ overflowX: 'auto' }}>
            <Table striped hover bordered size="sm" className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Part Number</th>
                  <th>Manufacturer</th>
                  <th>Date Code</th>
                  <th>Description</th>
                  <th>Uploaded</th>
                  <th>Country</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-bold">{selectedItem.part_number}</td>
                  <td>{selectedItem.mfr && selectedItem.mfr.toLowerCase() !== 'nan' ? selectedItem.mfr : '-'}</td>
                  <td>
                    {selectedItem.dc && selectedItem.dc.toLowerCase() !== 'nan' ? (
                      <span>{selectedItem.dc}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {selectedItem.description && selectedItem.description.toLowerCase() !== 'nan' ? (
                      <small title={selectedItem.description} className="text-muted">
                        {selectedItem.description.length > 50 ? selectedItem.description.substring(0, 50) + '...' : selectedItem.description}
                      </small>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {selectedItem.processed_at 
                      ? new Date(selectedItem.processed_at).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td>{selectedItem.country || '-'}</td>
                  <td>{selectedItem.qty || '-'}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderSupplierInfo = () => {
    if (!supplierInfo) return null;

    return (
      <div>
        {/* Header Section */}
        <div className="mb-4">
          <h3 className="mb-3">{supplierInfo.company_name}</h3>
          {supplierInfo.description && (
            <div className="mb-3">
              <h4>Description:</h4>
              <div className="mt-1 text-muted">{supplierInfo.description}</div>
            </div>
          )}
        </div>

        {/* Selected Part Information */}
        {renderSelectedItem()}

        {/* Contact Information Grid */}
        <Card className="mb-3">
          <Card.Body className="p-2">
            <h4 className="mb-3">Contact Information</h4>
            <Row className="g-3">
              {/* Address */}
              {supplierInfo.address && (
                <Col md={6}>
                  <div>
                    <h5 className="d-block mb-2">Address:</h5>
                    <div className="text-muted">
                      {supplierInfo.address}
                    </div>
                  </div>
                </Col>
              )}

              {/* Contact Details */}
              <Col md={6}>
                {supplierInfo.phoneNumber && (
                  <div className="mb-2">
                    <strong>Telephone:</strong>
                    <div>
                      <a href={`tel:${supplierInfo.phoneNumber}`}>{supplierInfo.phoneNumber}</a>
                    </div>
                  </div>
                )}
                
                {supplierInfo.website && (
                  <div className="mb-2">
                    <strong>Website:</strong>
                    <div>
                      <a href={supplierInfo.website} target="_blank" rel="noopener noreferrer">
                        {supplierInfo.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {supplierInfo.contact_email && selectedItem && (
                  <div className="mb-2">
                    <strong>Email:</strong>
                    <div>
                      <a href={`mailto:${supplierInfo.contact_email}?subject=Inquiry%20About%20${selectedItem.part_number}`}>{supplierInfo.contact_email}</a>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable dialogClassName="custom-modal-width ic-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h2">
          Supplier Information
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading supplier details...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

        {!loading && !error && supplierInfo && (
          <div>
            {renderSupplierInfo()}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SupplierModal;
