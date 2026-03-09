import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import './StockDetailModal.css';

const StockDetailModal = ({ isOpen, onClose, stock }) => {
  const { portfolio, watchlist, toggleWatchlist } = usePortfolio();
  const [chartPeriod, setChartPeriod] = useState('1A');
  const [chartData, setChartData] = useState([]);

  // Mock Tarihsel Veri Üretici (CollectAPI'de tarihsel veri olmadığı için simülasyon)
  const generateMockData = (currentPrice, period) => {
    let points = 0;
    let volatility = 0;

    switch (period) {
      case '24S': points = 24; volatility = 0.01; break;
      case '1H': points = 7; volatility = 0.03; break;
      case '1A': points = 30; volatility = 0.08; break;
      case '1Y': points = 12; volatility = 0.25; break;
      default: points = 30; volatility = 0.08;
    }

    const data = [];
    let simulatedPrice = currentPrice * (1 - (Math.random() * volatility)); // Geçmişten başlat

    for (let i = 0; i < points; i++) {
      data.push(simulatedPrice);
      const change = 1 + ((Math.random() - 0.48) * volatility); // %48 düşüş, %52 yükseliş eğilimi
      simulatedPrice = simulatedPrice * change;
    }
    data[points - 1] = currentPrice; // Son nokta her zaman güncel fiyat
    return data;
  };

  useEffect(() => {
    if (stock) {
      setChartData(generateMockData(stock.price, chartPeriod));
    }
  }, [stock, chartPeriod]);

  if (!isOpen || !stock) return null;

  const isWatched = watchlist.includes(stock.name);
  const changeRate = parseFloat(stock.rate) || 0;
  const isUp = changeRate >= 0;

  // Portföy İstatistikleri Hesaplama
  const ownedStock = portfolio.find(s => s.symbol === stock.name);
  let totalInvestment = 0;
  let currentValue = 0;
  let profitLoss = 0;
  let profitLossPercent = 0;

  if (ownedStock) {
    totalInvestment = ownedStock.quantity * ownedStock.averagePrice;
    currentValue = ownedStock.quantity * stock.price;
    profitLoss = currentValue - totalInvestment;
    profitLossPercent = (profitLoss / totalInvestment) * 100;
  }

  // Pure SVG Line Chart Hesaplamaları
  const renderChart = () => {
    if (chartData.length === 0) return null;

    const width = 600;
    const height = 180;
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min === 0 ? 1 : max - min;
    const padding = 20;

    const points = chartData.map((val, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const strokeColor = chartData[0] <= chartData[chartData.length - 1] ? '#4ade80' : '#fb7185';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart-container" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartGradient)" className="svg-area" />
        <polyline points={points} className="svg-line" stroke={strokeColor} />
      </svg>
    );
  };

  const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="detail-header">
          <div className="detail-title">
            <h2>{stock.name}</h2>
            <div className="detail-price-row">
              <span className="detail-price">{formatCurrency(stock.price)}</span>
              <span className={isUp ? 'text-success' : 'text-danger'} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem' }}>
                {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {isUp ? '+' : ''}{changeRate}%
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <button 
              className={`icon-btn ${isWatched ? 'active' : ''}`} 
              onClick={() => toggleWatchlist(stock.name)}
              title="Takip Listesi"
            >
              <Star size={24} fill={isWatched ? "currentColor" : "none"} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Kapat">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CHART BÖLÜMÜ */}
        <div className="chart-section">
          <div className="chart-filters">
            {['24S', '1H', '1A', '1Y'].map(period => (
              <button 
                key={period} 
                className={`chart-filter-btn ${chartPeriod === period ? 'active' : ''}`}
                onClick={() => setChartPeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>
          {renderChart()}
        </div>

        {/* İSTATİSTİKLER (VARLIKLARIM) */}
        <div className="stats-section">
          <h3>Yatırım Özeti</h3>
          {ownedStock ? (
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">Sahip Olunan Adet</span>
                <span className="stat-value">{ownedStock.quantity} Lot</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Ortalama Maliyet</span>
                <span className="stat-value">{formatCurrency(ownedStock.averagePrice)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Toplam Yatırım</span>
                <span className="stat-value">{formatCurrency(totalInvestment)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Güncel Değer</span>
                <span className="stat-value">{formatCurrency(currentValue)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Net Kâr / Zarar</span>
                <span className={`stat-value ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                  {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Kâr / Zarar Oranı</span>
                <span className={`stat-value ${profitLossPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="not-owned-alert">
              <Clock size={24} style={{ marginBottom: '10px', color: 'var(--accent)' }} />
              <p style={{ margin: 0 }}>Şu anda portföyünüzde <strong>{stock.name}</strong> hissesi bulunmuyor. Dashboard üzerinden alım işlemi yapabilirsiniz.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StockDetailModal;