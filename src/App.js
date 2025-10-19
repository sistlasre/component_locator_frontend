import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ComponentLocator from './components/ComponentLocator';
import ComponentSearchResults from './components/ComponentSearchResults';
import SupplierRegistration from './components/SupplierRegistration';
import { AuthProvider } from './contexts/AuthContext';

function Layout({ children }) {
  return (
    <div className="App d-flex flex-column min-vh-100" style={{ maxWidth: '90%', margin: 'auto' }}>
      <Header />
      <main className="flex-grow-1">{children}</main>
      <Footer />
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
