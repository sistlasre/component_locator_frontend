import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const UserSubscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsubscribing, setUnsubscribing] = useState({});

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSubscriptions();
  }, [user, authLoading, navigate]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSubscriptions(user);
      setSubscriptions(response.data.subscribedParts || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (partNumber) => {
    setUnsubscribing(prev => ({ ...prev, [partNumber]: true }));
    try {
      await apiService.unsubscribe(partNumber, user);
      setSubscriptions(prev => prev.filter(part => part !== partNumber));
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(`Failed to unsubscribe from ${partNumber}. Please try again.`);
    } finally {
      setUnsubscribing(prev => ({ ...prev, [partNumber]: false }));
    }
  };

  // Show loading spinner while auth is loading or subscriptions are loading
  if (authLoading || loading) {
    return (
      <Container fluid className="py-5">
        <Row>
          <Col className="text-center">
            <Spinner animation="border" role="status" className="mb-3" />
            <p>{authLoading ? 'Checking authentication...' : 'Loading your subscriptions...'}</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // If auth is loaded but no user, they'll be redirected by useEffect
  if (!user) {
    return null;
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">
            <FontAwesomeIcon icon={faBell} className="me-2" />
            My Subscriptions
          </h2>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Alert variant="info">
          You don't have any active subscriptions. Search for parts and click the subscribe button to get notified when they become available.
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <p className="text-muted mb-3">
              You are subscribed to <Badge bg="primary">{subscriptions.length}</Badge> part{subscriptions.length !== 1 ? 's' : ''}
            </p>
            <Table striped hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Part Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((partNumber) => (
                  <tr key={partNumber}>
                    <td className="fw-bold align-middle">{partNumber}</td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleUnsubscribe(partNumber)}
                        disabled={unsubscribing[partNumber]}
                      >
                        <FontAwesomeIcon icon={faBellSlash} className="me-1" />
                        {unsubscribing[partNumber] ? 'Unsubscribing...' : 'Unsubscribe'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default UserSubscriptions;
