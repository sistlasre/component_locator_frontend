import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Header = () => {
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
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
