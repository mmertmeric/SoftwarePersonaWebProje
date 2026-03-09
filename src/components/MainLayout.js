// src/components/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;