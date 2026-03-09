// src/pages/StockSearch.js
import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchLivePrices } from '../services/api';
import { getSectorBySymbol, BIST_SECTORS } from '../utils/sectorMapping';
import { Search, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import StockDetailModal from '../components/StockDetailModal';
import './StockSearch.css';

// Temsili BIST 30 Listesi
const BIST30_SYMBOLS = [
  "AKBNK", "ALARK", "ASELS", "ASTOR", "BIMAS", "BRISA", "CCOLA", "CWENE", 
  "ENJSA", "ENKAI", "EREGL", "FROTO", "GARAN", "GUBRF", "HEKTS", "ISCTR", 
  "KCHOL", "KONTR", "KOZAL", "KRDMD", "ODAS", "OYAKC", "PETKM", "PGSUS", 
  "SAHOL", "SASA", "SISE", "TCELL", "THYAO", "TOASO", "TUPRS", "YKBNK"
];

const StockSearch = () => {
  const { watchlist, toggleWatchlist } = usePortfolio();
  
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('HEPSİ');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-desc', 'price-asc', 'gainers', 'losers'
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [selectedStock, setSelectedStock] = useState(null);

  const loadAllStocks = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const fullData = await fetchLivePrices();
      if (fullData && fullData.length > 0) {
        setStocks(fullData);
      } else {
        setError("Hisse verileri şu an alınamıyor. Lütfen API bağlantınızı kontrol edin.");
      }
    } catch (err) {
      setError("Veri çekilirken bir hata oluştu.");
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadAllStocks();
    const interval = setInterval(() => {
      loadAllStocks();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtreleme ve Sıralama Logic'i
  const processedStocks = useMemo(() => {
    let result = [...stocks];

    // 1. Sektör Filtresi
    if (selectedSector !== 'HEPSİ') {
      // Eğer bir sektör seçildiyse BIST 30'u ezer, o sektördeki tüm hisseleri getirir
      result = result.filter(stock => getSectorBySymbol(stock.name) === selectedSector);
      if (searchTerm) {
        result = result.filter(stock => stock.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
    } else {
      // 2. Sektör seçili değilse, Arama veya Varsayılan (BIST 30) çalışır
      if (!searchTerm) {
        result = result.filter(stock => BIST30_SYMBOLS.includes(stock.name));
      } else {
        result = result.filter(stock => stock.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
    }

    // 3. Sıralama Logic'i
    switch (sortBy) {
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'gainers':
        result.sort((a, b) => (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0));
        break;
      case 'losers':
        result.sort((a, b) => (parseFloat(a.rate) || 0) - (parseFloat(b.rate) || 0));
        break;
      default:
        // Default (A-Z)
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [stocks, searchTerm, selectedSector, sortBy]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleCardClick = (stock) => {
    setSelectedStock(stock);
  };

  const handleWatchlistToggle = (e, symbol) => {
    e.stopPropagation();
    toggleWatchlist(symbol);
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <div className="search-header-top">
          <div>
            <h1>Hisse Keşfet</h1>
            <p>Borsa İstanbul piyasa verilerini ve sektörleri inceleyin.</p>
          </div>
          <button 
            onClick={loadAllStocks} 
            disabled={isFetching}
            className="add-btn" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <RefreshCw size={18} className={isFetching ? "spin-animation" : ""} />
            {isFetching ? 'Yenileniyor...' : 'Verileri Yenile'}
          </button>
        </div>

        {/* YENİ: SEKTÖR FİLTRELEME BUTONLARI */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin' }}>
          {['HEPSİ', ...Object.keys(BIST_SECTORS)].map(sector => (
            <button 
              key={sector}
              onClick={() => { setSelectedSector(sector); setSearchTerm(''); }}
              style={{ 
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: '20px',
                border: `1px solid ${selectedSector === sector ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedSector === sector ? 'var(--accent)' : 'transparent',
                color: selectedSector === sector ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: selectedSector === sector ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              {sector.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="search-controls">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Hisse ara (Örn: TÜPRAŞ, THYAO)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sıralama: A - Z</option>
            <option value="price-desc">Fiyat: En Yüksek</option>
            <option value="price-asc">Fiyat: En Düşük</option>
            <option value="gainers">Günün Kazandıranları</option>
            <option value="losers">Günün Kaybettirenleri</option>
          </select>
        </div>
      </div>

      <div className="view-indicator">
        {selectedSector !== 'HEPSİ' 
          ? `Sektör Görünümü: ${selectedSector.replace('_', ' ')} (${processedStocks.length} hisse)`
          : searchTerm 
            ? `Arama Sonuçları: ${processedStocks.length} hisse bulundu.` 
            : `Varsayılan Görünüm: BIST 30 Hisseleri`}
      </div>

      {isFetching && stocks.length === 0 ? (
        <div className="loading-state">
          <RefreshCw size={32} className="spin-animation" style={{ marginBottom: '15px', color: 'var(--accent)' }} />
          <p>Piyasa verileri yükleniyor, lütfen bekleyin...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="add-btn" onClick={loadAllStocks} style={{ marginTop: '15px' }}>Tekrar Dene</button>
        </div>
      ) : processedStocks.length === 0 ? (
        <div className="empty-search-state">
          <p>Seçilen kriterlere uygun hisse bulunamadı.</p>
        </div>
      ) : (
        <div className="stock-grid">
          {processedStocks.map((stock) => {
            const isWatched = watchlist.includes(stock.name);
            const change = parseFloat(stock.rate) || 0;
            const isUp = change >= 0;
            const sectorName = getSectorBySymbol(stock.name);

            return (
              <div key={stock.name} className="stock-card" onClick={() => handleCardClick(stock)}>
                <div className="stock-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="stock-symbol">{stock.name}</span>
                    {/* YENİ: HİSSE KARTINDA SEKTÖR BADGE'İ */}
                    {sectorName !== 'DIGER' && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '3px 6px', 
                        borderRadius: '4px', 
                        background: 'rgba(56, 189, 248, 0.1)', 
                        color: 'var(--accent)',
                        fontWeight: '600'
                      }}>
                        {sectorName.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <button 
                    className="watchlist-btn" 
                    onClick={(e) => handleWatchlistToggle(e, stock.name)}
                    title={isWatched ? "Takip Listesinden Çıkar" : "Takip Listesine Ekle"}
                  >
                    <Star 
                      size={22} 
                      className={`star-icon ${isWatched ? 'active' : ''}`} 
                    />
                  </button>
                </div>
                <div className="stock-card-body">
                  <div className="stock-price-info">
                    <span className="stock-price">{formatCurrency(stock.price)}</span>
                  </div>
                  <div className={`stock-change ${isUp ? 'text-success' : 'text-danger'}`}>
                    {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {isUp ? '+' : ''}{change}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAY MODALI */}
      <StockDetailModal 
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
        stock={selectedStock}
      />

    </div>
  );
};

export default StockSearch;