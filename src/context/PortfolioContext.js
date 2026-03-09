// src/context/PortfolioContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; 

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // YENİ KORUMA KİLİDİ: Verilerin boş diziyle ezilmesini engeller
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. KULLANICI GİRİŞ YAPTIĞINDA VEYA SAYFA YENİLENDİĞİNDE VERİLERİ OKU
  useEffect(() => {
    if (user && user.email) {
      const savedPortfolio = JSON.parse(localStorage.getItem(`portfolio_${user.email}`) || '[]');
      const savedWatchlist = JSON.parse(localStorage.getItem(`watchlist_${user.email}`) || '[]');
      const savedTransactions = JSON.parse(localStorage.getItem(`transactions_${user.email}`) || '[]');
      
      setPortfolio(savedPortfolio);
      setWatchlist(savedWatchlist);
      setTransactions(savedTransactions);
      
      // Okuma bitti, artık kaydetme işlemine izin verebiliriz
      setIsDataLoaded(true); 
    } else {
      setPortfolio([]);
      setWatchlist([]);
      setTransactions([]);
      setIsDataLoaded(false);
    }
  }, [user]);

  // 2. VERİLER DEĞİŞTİĞİNDE KAYDET (Sadece koruma kilidi açıksa çalışır)
  useEffect(() => {
    if (isDataLoaded && user && user.email) {
      localStorage.setItem(`portfolio_${user.email}`, JSON.stringify(portfolio));
      localStorage.setItem(`watchlist_${user.email}`, JSON.stringify(watchlist));
      localStorage.setItem(`transactions_${user.email}`, JSON.stringify(transactions));
    }
  }, [portfolio, watchlist, transactions, isDataLoaded, user]);

  const logTransaction = (type, symbol, quantity, price) => {
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type, 
      symbol,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      total: parseFloat(quantity) * parseFloat(price)
    };
    setTransactions(prev => [newTransaction, ...prev]); 
  };

  const buyStock = (symbol, quantity, price) => {
    const qty = parseFloat(quantity);
    const prc = parseFloat(price);

    setPortfolio((prev) => {
      const existingStock = prev.find((s) => s.symbol === symbol);

      if (existingStock) {
        const oldTotal = existingStock.quantity * existingStock.averagePrice;
        const newTotal = qty * prc;
        const newQuantity = existingStock.quantity + qty;
        const newAveragePrice = (oldTotal + newTotal) / newQuantity;

        return prev.map((s) =>
          s.symbol === symbol
            ? { ...s, quantity: newQuantity, averagePrice: newAveragePrice }
            : s
        );
      } else {
        return [...prev, { symbol, quantity: qty, averagePrice: prc, takeProfit: null, stopLoss: null }];
      }
    });

    logTransaction('ALIŞ', symbol, qty, prc);
  };

  const sellStock = (symbol, quantityToSell, sellPrice = 0) => {
    const qtyToSell = parseFloat(quantityToSell);

    setPortfolio((prev) => {
      const existingStock = prev.find((s) => s.symbol === symbol);
      if (!existingStock) return prev;

      if (existingStock.quantity <= qtyToSell) {
        return prev.filter((s) => s.symbol !== symbol);
      } else {
        return prev.map((s) =>
          s.symbol === symbol
            ? { ...s, quantity: existingStock.quantity - qtyToSell }
            : s
        );
      }
    });

    logTransaction('SATIŞ', symbol, qtyToSell, sellPrice);
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      return [...prev, symbol];
    });
  };

  const setStockTargets = (symbol, takeProfit, stopLoss) => {
    setPortfolio((prev) => 
      prev.map((s) => 
        s.symbol === symbol 
          ? { 
              ...s, 
              takeProfit: takeProfit ? parseFloat(takeProfit) : null, 
              stopLoss: stopLoss ? parseFloat(stopLoss) : null 
            } 
          : s
      )
    );
  };

  return (
    <PortfolioContext.Provider value={{ 
      portfolio, 
      watchlist, 
      transactions, 
      buyStock, 
      sellStock, 
      toggleWatchlist,
      setStockTargets 
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);