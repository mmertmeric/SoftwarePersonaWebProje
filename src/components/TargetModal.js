import React, { useState, useEffect } from 'react';
import { X, Crosshair, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import './TargetModal.css';

const TargetModal = ({ isOpen, onClose, stock }) => {
  const { setStockTargets } = usePortfolio();
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  useEffect(() => {
    if (stock) {
      setTakeProfit(stock.takeProfit || '');
      setStopLoss(stock.stopLoss || '');
    }
  }, [stock]);

  if (!isOpen || !stock) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setStockTargets(stock.symbol, takeProfit, stopLoss);
    onClose();
  };

  const handleClear = () => {
    setStockTargets(stock.symbol, null, null);
    onClose();
  };

  return (
    <div className="target-modal-overlay" onClick={onClose}>
      <div className="target-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="target-modal-header">
          <h2><Crosshair size={20} color="var(--accent)"/> {stock.symbol} Hedefleri</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="target-input-group">
            <label>
              <span><TrendingUp size={14} color="#4ade80" /> Kâr Al (Take-Profit)</span>
              <span>Anlık: {stock.currentPrice}</span>
            </label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Hedef satış fiyatı girin" 
              value={takeProfit} 
              onChange={(e) => setTakeProfit(e.target.value)} 
            />
          </div>

          <div className="target-input-group">
            <label>
              <span><TrendingDown size={14} color="#fb7185" /> Zarar Kes (Stop-Loss)</span>
            </label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Taban satış fiyatı girin" 
              value={stopLoss} 
              onChange={(e) => setStopLoss(e.target.value)} 
            />
          </div>

          <button type="submit" className="save-targets-btn">Hedefleri Kaydet</button>
          
          {(stock.takeProfit || stock.stopLoss) && (
            <button type="button" className="clear-targets-btn" onClick={handleClear}>
              Alarmları Temizle
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default TargetModal;