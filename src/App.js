// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext'; 
import MainLayout from './components/MainLayout';
import Auth from './pages/Auth/Auth'; 
import Dashboard from './pages/Dashboard';
import StockSearch from './pages/StockSearch';
import Profile from './pages/Profile';
import './styles/theme.css';
import './styles/global.css';
 
// Korumalı Rotalar (Route Guards)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Yükleniyor...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      {/* PortfolioProvider, AuthProvider'ın İÇİNDE olmalı ki 'user' verisine erişebilsin */}
      <PortfolioProvider> 
        <ThemeProvider>
          <Router>
            <Routes>
              {/* LOGIN/REGISTER: Sadece giriş yapmamış olanlar görebilir */}
              <Route path="/login" element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } />

              {/* ANA UYGULAMA: Sadece giriş yapmış olanlar görebilir */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="search" element={<StockSearch />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Yanlış rotaları ana sayfaya yönlendir */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </PortfolioProvider>
    </AuthProvider>
  );
}

export default App;