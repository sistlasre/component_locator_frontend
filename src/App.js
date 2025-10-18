import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
// Components
import ComponentLocator from './components/ComponentLocator';
import ComponentSearchResults from './components/ComponentSearchResults';
import SupplierRegistration from './components/SupplierRegistration';
import { AuthProvider } from './contexts/AuthContext';

function Layout({ children }) {
  //const location = useLocation();
  const dontShowHeaderAndFooter = true; // location.pathname?.includes("raw");
  return (
    <div className="App d-flex flex-column min-vh-100" style={{ maxWidth: '90%', margin: 'auto' }}>
      {!dontShowHeaderAndFooter && <Header />}
      <main className="flex-grow-1">{children}</main>
      {!dontShowHeaderAndFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
            <Routes>
              <Route path="/" element={<ComponentLocator />} />
              <Route path="/search" element={<ComponentSearchResults />} />
              <Route path="/supplier/register" element={<SupplierRegistration />} />
            </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
