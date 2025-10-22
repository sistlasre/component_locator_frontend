import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm border-bottom" variant="light">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <img 
            src="/inventory-capture-logo-main.png" 
            alt="Inventory Capture Logo" 
            height="40"
            className="me-2"
            style={{ maxHeight: '40px', width: 'auto' }}
          />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Search Parts</Nav.Link>
            <Nav.Link as={Link} to="/supplier/register">Supplier Registration</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  <FontAwesomeIcon icon={faUser} className="me-1" />
                  Welcome, {user}
                </Navbar.Text>
                <Button variant="outline-primary" size="sm" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
