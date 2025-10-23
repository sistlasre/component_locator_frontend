import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
// Components
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ComponentLocator from './components/ComponentLocator';
import ComponentSearchResults from './components/ComponentSearchResults';
import SupplierRegistration from './components/SupplierRegistration';
import Login from './components/Login';
import Register from './components/Register';
import LoggedOutRoute from './components/LoggedOutRoute';

function Layout({ children }) {
  return (
    <div className="App d-flex flex-column min-vh-100" style={{ maxWidth: '90%', margin: 'auto', backgroundColor: '#fff' }}>
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
              <Route path="/login" element={<LoggedOutRoute><Login /></LoggedOutRoute>} />
              <Route path="/register" element={<LoggedOutRoute><Register /></LoggedOutRoute>} />
            </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
