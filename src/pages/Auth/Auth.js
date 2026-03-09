// src/pages/Auth/Auth.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: '', email: '', password: '', confirmPassword: '', profession: '' 
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      const success = login({ email: formData.email, password: formData.password });
      if (success) navigate('/'); else alert('Kullanıcı adı veya şifre hatalı!');
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('Şifreler eşleşmiyor!');
        return;
      }
      register(formData);
      navigate('/');
    }
  };

  const fillDemoAccount = () => {
    setFormData({ ...formData, email: 'admin', password: 'admin61' });
    setShowDemoPopup(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Portföye Giriş Yap' : 'Yeni Portföy Oluştur'}</h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Ad Soyad" required 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              <input type="text" placeholder="Meslek / Unvan" required 
                onChange={(e) => setFormData({...formData, profession: e.target.value})} />
            </>
          )}
          
          <input type="text" placeholder={isLogin ? "E-posta veya Kullanıcı Adı" : "E-posta"} required 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})} />
            
          <input type="password" placeholder="Şifre" required 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
            
          {!isLogin && (
            <input type="password" placeholder="Şifre (Tekrar)" required 
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
          )}
          
          <button type="submit" className="auth-btn">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        {isLogin && (
          <p className="demo-link" onClick={() => setShowDemoPopup(true)}>
            Örnek hesap denemek ister misiniz?
          </p>
        )}

        <p className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten üye misin? Giriş Yap'}
        </p>
      </div>

      {/* Demo Hesap Pop-up */}
      {showDemoPopup && (
        <div className="demo-popup-overlay">
          <div className="demo-popup">
            <h3>Örnek Hesap Bilgileri</h3>
            <p>Sistemi test etmek için aşağıdaki bilgileri kullanabilirsiniz:</p>
            <div className="demo-credentials">
              <span><strong>Kullanıcı Adı:</strong> admin</span>
              <span><strong>Şifre:</strong> admin61</span>
            </div>
            <div className="demo-popup-actions">
              <button onClick={fillDemoAccount} className="fill-btn">Bilgileri Doldur</button>
              <button onClick={() => setShowDemoPopup(false)} className="close-btn">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;