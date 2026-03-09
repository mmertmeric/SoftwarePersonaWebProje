// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Search, LayoutDashboard, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Sol Kısım: Kullanıcı Adı (Marka/Logo Alanı) */}
      <div className="nav-brand">
        <Link to="/">
          <div className="brand-user-container">
            <span className="user-name-brand">{user?.fullName || 'BIST Portföy'}</span>
            {user?.profession && (
              <span className="user-profession">{user.profession}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Orta Kısım: Menü Linkleri */}
      <div className="nav-links">
        <Link title="Dashboard" to="/">
          <LayoutDashboard size={20} />
          <span className="link-text">Özet</span>
        </Link>
        <Link title="Hisse Ara" to="/search">
          <Search size={20} />
          <span className="link-text">Keşfet</span>
        </Link>
        <Link title="Profil" to="/profile">
          <User size={20} />
          <span className="link-text">Profil</span>
        </Link>
      </div>

      {/* Sağ Kısım: Tema ve Çıkış İşlemleri */}
      <div className="nav-actions">
        <button onClick={toggleTheme} className="theme-toggle" title="Temayı Değiştir">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button onClick={handleLogout} className="logout-btn" title="Çıkış Yap">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;