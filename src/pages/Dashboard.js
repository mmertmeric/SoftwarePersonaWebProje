// src/pages/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Activity, 
  RefreshCw, 
  Check, 
  X,
  PieChart,
  Info,
  History,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import SellModal from '../components/SellModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import TargetModal from '../components/TargetModal'; 
import PortfolioChart from '../components/PortfolioChart'; 
import { fetchLivePrices } from '../services/api';
import { getSectorBySymbol } from '../utils/sectorMapping';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { portfolio, watchlist, toggleWatchlist } = usePortfolio(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockForAdd, setSelectedStockForAdd] = useState('');
  const [selectedStockForSell, setSelectedStockForSell] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStockForTarget, setSelectedStockForTarget] = useState(null); 

  const [liveData, setLiveData] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);

  // --- API'DEN VERİ ÇEKME LOGIC ---
  const loadLivePrices = async () => {
    setIsFetching(true);
    const fullData = await fetchLivePrices(); 
    
    const mappedData = {};
    if (fullData && fullData.length > 0) {
      fullData.forEach(stock => {
        if (portfolio.some(p => p.symbol === stock.name) || watchlist.includes(stock.name)) {
          mappedData[stock.name] = {
            price: stock.price,
            change: stock.rate
          };
        }
      });
    }

    setLiveData(mappedData);
    setIsFetching(false);
    setIsUpdated(true);
    setTimeout(() => setIsUpdated(false), 2000);
  };

  useEffect(() => {
    loadLivePrices();
    const interval = setInterval(() => {
      loadLivePrices();
    }, 60000);
    return () => clearInterval(interval);
  }, [portfolio, watchlist]);

  const getCurrentPrice = (symbol, avgPrice = 0) => liveData[symbol]?.price || avgPrice;
  const getDailyChange = (symbol) => liveData[symbol]?.change || 0;

  // --- FİNANSAL HESAPLAMALAR ---
  const totalCost = portfolio.reduce((acc, stock) => acc + (stock.quantity * stock.averagePrice), 0);
  
  const totalValue = portfolio.reduce((acc, stock) => {
    return acc + (stock.quantity * getCurrentPrice(stock.symbol, stock.averagePrice));
  }, 0);

  const totalProfitLoss = totalValue - totalCost;
  const profitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
  const isProfit = totalProfitLoss >= 0;

  const dailyProfitLoss = portfolio.reduce((acc, stock) => {
    const currentPrice = getCurrentPrice(stock.symbol, stock.averagePrice);
    const dailyChangePercent = parseFloat(getDailyChange(stock.symbol)) || 0;
    const yesterdayPrice = currentPrice / (1 + (dailyChangePercent / 100));
    const dailyPl = (currentPrice - yesterdayPrice) * stock.quantity;
    return acc + dailyPl;
  }, 0);
  const dailyIsProfit = dailyProfitLoss >= 0;

  // --- PORTFÖY DAĞILIMI (Hisse Bazlı) ---
  const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#4ade80'];
  const portfolioAllocation = useMemo(() => {
    if (totalValue === 0) return [];
    return portfolio.map((stock, index) => {
      const value = stock.quantity * getCurrentPrice(stock.symbol, stock.averagePrice);
      const percentage = (value / totalValue) * 100;
      return {
        symbol: stock.symbol,
        percentage,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [portfolio, totalValue, liveData]);

  // --- SEKTÖREL DAĞILIM ---
  const sectorAllocation = useMemo(() => {
    if (totalValue === 0) return [];
    const sectors = {};
    portfolio.forEach(stock => {
      const sector = getSectorBySymbol(stock.symbol);
      const val = stock.quantity * getCurrentPrice(stock.symbol, stock.averagePrice);
      sectors[sector] = (sectors[sector] || 0) + val;
    });
    return Object.entries(sectors).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalValue) * 100
    })).sort((a, b) => b.value - a.value);
  }, [portfolio, totalValue, liveData]);

  const formatCurrency = (value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  const openAddModal = (symbol = '') => { setSelectedStockForAdd(symbol); setIsModalOpen(true); };

  // YENİ: Veri gelmediyse kullanıcıyı uyarmak için kontrol değişkeni
  const isDataMissing = portfolio.length > 0 && Object.keys(liveData).length === 0 && !isFetching;

  return (
    <div className="dashboard-container">
      {/* HEADER BÖLÜMÜ */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Hoş Geldin, {user?.fullName?.split(' ')[0] || 'Kullanıcı'} 👋</h1>
          <p>İşte portföyünün güncel durumu.</p>
        </div>
        
        {/* YENİ: BUTON VE UYARI METNİ ALANI */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {isDataMissing && (
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#fb7185', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontWeight: '500',
              animation: 'pulse 2s infinite'
            }}>
              <AlertCircle size={14} /> Anlık veriler yüklenmedi, yenileyin 👇
            </span>
          )}
          <button 
            onClick={loadLivePrices} 
            disabled={isFetching || isUpdated}
            className={`add-btn ${isUpdated ? 'btn-success-state' : ''}`} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: isUpdated ? '' : 'var(--bg-card)', 
              color: isUpdated ? '' : 'var(--text-primary)', 
              border: isUpdated ? '' : (isDataMissing ? '1px solid #fb7185' : '1px solid var(--border)'),
              boxShadow: isDataMissing ? '0 0 10px rgba(251, 113, 133, 0.2)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            {isFetching ? <RefreshCw size={18} className="spin-animation" /> : isUpdated ? <Check size={18} /> : <RefreshCw size={18} />}
            {isFetching ? 'Güncelleniyor...' : isUpdated ? 'Güncellendi!' : 'Canlı Veri'}
          </button>
        </div>
      </header>

      {/* ÖZET KARTLARI */}
      <div className="summary-cards">
        <div className="card">
          <div className="card-icon"><Wallet size={24} /></div>
          <div className="card-info">
            <p>Toplam Maliyet (Yatırım)</p>
            <h3>{formatCurrency(totalCost)}</h3>
          </div>
        </div>

        <div className="card">
          <div className="card-icon"><DollarSign size={24} /></div>
          <div className="card-info">
            <p>Güncel Varlık Değeri</p>
            <h3>{formatCurrency(totalValue)}</h3>
          </div>
        </div>

        <div className={`card ${isProfit ? 'profit-card' : 'loss-card'}`}>
          <div className="card-icon">{isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}</div>
          <div className="card-info">
            <p>Toplam Kâr / Zarar</p>
            <h3>
              {totalProfitLoss > 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
              <span className="badge">({totalProfitLoss > 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%)</span>
            </h3>
          </div>
        </div>

        <div className={`card ${dailyIsProfit ? 'profit-card' : 'loss-card'}`}>
          <div className="card-icon"><Activity size={24} /></div>
          <div className="card-info">
            <p>Günlük Kâr / Zarar</p>
            <h3>{dailyProfitLoss > 0 ? '+' : ''}{formatCurrency(dailyProfitLoss)}</h3>
          </div>
        </div>
      </div>

      {/* PORTFÖY BÜYÜME GRAFİĞİ */}
      <PortfolioChart 
        totalCost={totalCost} 
        totalValue={totalValue} 
        totalProfitLoss={totalProfitLoss} 
      />

      {/* SEKTÖREL ANALİZ PANELİ */}
      {portfolio.length > 0 && (
        <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px', marginTop: '10px' }}>
           <div className="card" style={{ padding: '20px', display: 'block' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', fontSize: '1.1rem' }}>
                <PieChart size={20} color="var(--accent)" /> Sektörel Dağılım
              </h3>
              {sectorAllocation.length > 0 ? (
                <div className="sector-list">
                  {sectorAllocation.map((item, index) => (
                    <div key={item.name} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>%{item.percentage.toFixed(1)}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%',
                          width: `${item.percentage}%`, 
                          backgroundColor: `hsl(${200 + (index * 40)}, 70%, 50%)`,
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Veri hesaplanıyor...</p>
              )}
           </div>

           <div className="card" style={{ padding: '20px', display: 'block', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0', fontSize: '1.1rem' }}>
                <Info size={20} color="var(--accent)" /> Strateji Notu
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                {sectorAllocation.length > 0 && sectorAllocation[0].percentage > 50 
                  ? `Portföyünüzün büyük bir kısmı (%${sectorAllocation[0].percentage.toFixed(1)}) ${sectorAllocation[0].name} sektöründe yoğunlaşmış durumda. Piyasa risklerini azaltmak için diğer sektörlerden (örn: Teknoloji veya Gıda) fırsatları Keşfet sayfasından inceleyerek çeşitlendirme yapabilirsiniz.`
                  : "Portföy dağılımınız oldukça dengeli görünüyor. Risk yönetimi açısından başarılı bir strateji izliyorsunuz. Yeni fırsatlar için 'Keşfet' sayfasını takip etmeye devam edin."
                }
              </p>
           </div>
        </div>
      )}

      {/* VARLIK DAĞILIM ÇUBUĞU VE LEGENDS */}
      {portfolio.length > 0 && (
        <div className="allocation-section">
          <h3>Hisse Ağırlıkları</h3>
          <div className="allocation-bar-container">
            {portfolioAllocation.map((item) => (
              <div 
                key={item.symbol} 
                className="allocation-segment"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                title={`${item.symbol}: %${item.percentage.toFixed(1)}`}
              ></div>
            ))}
          </div>
          <div className="allocation-legends">
             {portfolioAllocation.map((item) => (
               <div key={item.symbol} className="legend-item">
                 <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                 <span className="legend-text">{item.symbol} (%{item.percentage.toFixed(1)})</span>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* VARLIKLARIM TABLOSU */}
      <div className="portfolio-section">
        <div className="section-header">
          <h2>Varlıklarım</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="add-btn" 
              style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }} 
              onClick={() => setIsHistoryOpen(true)}
            >
              <History size={16} /> İşlem Geçmişi
            </button>
            <button className="add-btn" onClick={() => openAddModal('')}>+ Yeni Hisse Ekle</button>
          </div>
        </div>

        {portfolio.length === 0 ? (
          <div className="empty-state"><p>Henüz portföyüne hisse eklemedin.</p></div>
        ) : (
          <div className="table-responsive">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Sembol</th>
                  <th>Adet</th>
                  <th>Ort. Maliyet</th>
                  <th>Toplam Yatırım</th>
                  <th>Anlık Fiyat</th>
                  <th>Günlük %</th>
                  <th>Güncel Değer</th>
                  <th>Kâr/Zarar (TL)</th>
                  <th>Kâr %</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock) => {
                  const currentPrice = getCurrentPrice(stock.symbol, stock.averagePrice);
                  const dailyChangePercent = getDailyChange(stock.symbol);
                  const totalInvestment = stock.quantity * stock.averagePrice;
                  const currentValue = stock.quantity * currentPrice;
                  const pl = currentValue - totalInvestment;
                  const plPercent = (pl / totalInvestment) * 100;
                  const isStockProfit = pl >= 0;
                  const isDailyProfit = parseFloat(dailyChangePercent) >= 0;

                  const isTpReached = stock.takeProfit && currentPrice >= stock.takeProfit;
                  const isSlReached = stock.stopLoss && currentPrice <= stock.stopLoss;
                  const rowClass = isTpReached ? 'row-target-hit' : isSlReached ? 'row-stop-hit' : '';

                  return (
                    <tr key={stock.symbol} className={rowClass}>
                      <td className="symbol-cell">
                        <strong>{stock.symbol}</strong>
                        {isTpReached && <span className="target-badge badge-tp">KÂR AL TETİKLENDİ</span>}
                        {isSlReached && <span className="target-badge badge-sl">ZARAR KES TETİKLENDİ</span>}
                      </td>
                      <td>{stock.quantity}</td>
                      <td>{formatCurrency(stock.averagePrice)}</td>
                      <td>{formatCurrency(totalInvestment)}</td>
                      <td>{formatCurrency(currentPrice)}</td>
                      <td className={isDailyProfit ? 'text-success' : 'text-danger'}>
                        {isDailyProfit ? '+' : ''}{dailyChangePercent}%
                      </td>
                      <td><strong>{formatCurrency(currentValue)}</strong></td>
                      <td className={isStockProfit ? 'text-success' : 'text-danger'}>
                        {isStockProfit ? '+' : ''}{formatCurrency(pl)}
                      </td>
                      <td className={isStockProfit ? 'text-success' : 'text-danger'}>
                        {isStockProfit ? '+' : ''}{plPercent.toFixed(2)}%
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="add-btn" 
                            style={{ padding: '6px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }} 
                            onClick={() => setSelectedStockForTarget({ ...stock, currentPrice })}
                            title="Hedef/Stop Belirle"
                          >
                            <Crosshair size={16} />
                          </button>
                          <button className="add-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openAddModal(stock.symbol)}>
                            Ekle
                          </button>
                          <button className="sell-btn" onClick={() => setSelectedStockForSell(stock)}>
                            Sat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TAKİP LİSTEM ALANI */}
      <div className="watchlist-section">
        <div className="section-header">
          <h2>Takip Listem</h2>
          <button className="add-btn" style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }} onClick={() => window.location.href='/search'}>
            Hisse Keşfet
          </button>
        </div>
        
        {watchlist.length === 0 ? (
          <div className="empty-state"><p>Takip listende henüz hisse yok. Keşfet sayfasından ekleyebilirsin.</p></div>
        ) : (
          <div className="watchlist-grid">
            {watchlist.map(symbol => {
              const currentPrice = getCurrentPrice(symbol);
              const change = parseFloat(getDailyChange(symbol));
              const isUp = change >= 0;
              return (
                <div key={symbol} className="watchlist-card">
                  <div className="watchlist-header">
                    <span className="symbol-cell">{symbol}</span>
                    <button onClick={() => toggleWatchlist(symbol)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Listeden Çıkar">
                      <X size={16}/>
                    </button>
                  </div>
                  <h3 style={{ margin: '5px 0' }}>{formatCurrency(currentPrice)}</h3>
                  <span className={isUp ? 'text-success' : 'text-danger'} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {isUp ? '+' : ''}{change}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODALLAR */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialSymbol={selectedStockForAdd}
      />

      <SellModal 
        isOpen={!!selectedStockForSell} 
        onClose={() => setSelectedStockForSell(null)}
        stock={selectedStockForSell}
      />

      <TransactionHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      <TargetModal 
        isOpen={!!selectedStockForTarget} 
        onClose={() => setSelectedStockForTarget(null)} 
        stock={selectedStockForTarget} 
      />
    </div>
  );
};

export default Dashboard;