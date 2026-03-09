import React, { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import './PortfolioChart.css';

const PortfolioChart = ({ totalCost, totalValue, totalProfitLoss }) => {
  // 30 Günlük trend simülasyonu (Maliyetten güncel değere doğru ilerler)
  const chartData = useMemo(() => {
    if (totalValue === 0) return [];
    
    const points = 30;
    const data = [];
    const volatility = 0.015; // Günlük %1.5 dalgalanma payı
    let simulatedVal = totalCost; 

    for(let i = 0; i < points; i++) {
       data.push(simulatedVal);
       // Geriye kalan gün sayısına göre hedefe (totalValue) yaklaşma adımı
       const step = (totalValue - simulatedVal) / (points - i);
       // Hafif rastgele gürültü (gerçekçi piyasa efekti)
       const noise = simulatedVal * volatility * (Math.random() - 0.5);
       simulatedVal += step + noise;
    }
    data[points - 1] = totalValue; // Son nokta her zaman gerçek güncel değerdir
    return data;
  }, [totalCost, totalValue]);

  if (totalValue === 0) return null;

  const isProfit = totalProfitLoss >= 0;
  const strokeColor = isProfit ? '#4ade80' : '#fb7185';
  
  const renderChart = () => {
    const width = 800;
    const height = 230;
    const min = Math.min(...chartData) * 0.95; // Alt boşluk için %5 margin
    const max = Math.max(...chartData) * 1.05; // Üst boşluk için %5 margin
    const range = max - min === 0 ? 1 : max - min;
    const padding = 10;

    const points = chartData.map((val, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="portfolio-svg-wrapper" preserveAspectRatio="none">
        <defs>
          <linearGradient id="portfolioGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#portfolioGradient)" className="portfolio-svg-area" />
        <polyline points={points} className="portfolio-svg-line" stroke={strokeColor} />
      </svg>
    );
  };

  return (
    <div className="portfolio-chart-container">
      <div className="portfolio-chart-header">
        <div className="portfolio-chart-title">
          <h3><Activity size={20} color="var(--accent)" /> Portföy Büyüme Trendi</h3>
          <p>Son 30 günlük tahmini varlık gelişimi</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>Net Değişim</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: strokeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {isProfit ? '+' : ''}
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalProfitLoss)}
          </span>
        </div>
      </div>
      {renderChart()}
    </div>
  );
};

export default PortfolioChart;