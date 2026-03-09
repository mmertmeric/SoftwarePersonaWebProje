// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sistemde kayıtlı kullanıcıları kontrol et
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    
    // 2. Demo hesap yoksa, otomatik olarak sisteme göm
    const hasAdmin = users.find(u => u.email === 'admin');
    if (!hasAdmin) {
      users.push({ 
        id: 0, 
        fullName: 'Demo Hesap', 
        email: 'admin', 
        password: 'admin61', 
        profession: 'Ziyaretçi Hesabı' 
      });
      localStorage.setItem('registered_users', JSON.stringify(users));
    }

    // 3. Mevcut oturumu kontrol et
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const newUser = { ...userData, id: Date.now() };
    users.push(newUser);
    
    localStorage.setItem('registered_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const login = (credentials) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const foundUser = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // YENİ EKLENEN: Profil Bilgilerini Global Olarak Güncelleme Fonksiyonu
  const updateProfile = (newFullName, newProfession) => {
    if (!user) return;
    
    // 1. Aktif session'ı (oturumdaki kullanıcıyı) güncelle
    const updatedUser = { ...user, fullName: newFullName, profession: newProfession };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // 2. Veritabanındaki (registered_users) kullanıcıyı da bularak güncelle
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const userIndex = users.findIndex(u => u.email === user.email);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], fullName: newFullName, profession: newProfession };
        localStorage.setItem('registered_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);