// src/components/TransactionModal.js
import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchLivePrices } from '../services/api';
import { X, Loader, Search } from 'lucide-react';
import './TransactionModal.css';

const TransactionModal = ({ isOpen, onClose, initialSymbol = '' }) => {
  const { buyStock } = usePortfolio();
  
  // FORM STATE'LERİ
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    price: ''
  });

  // ARAMA VE VERİ STATE'LERİ
  const [searchTerm, setSearchTerm] = useState('');
  const [allStocks, setAllStocks] = useState([]); // API'den gelen 500+ hisse buraya
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedStockInfo, setSelectedStockInfo] = useState(null);

  // MODAL AÇILDIĞINDA TÜM BİST VERİSİNİ ÇEK VE İLK AYARLARI YAP
  useEffect(() => {
    const initializeModal = async () => {
      if (isOpen) {
        setIsFetching(true);
        // API'den tüm listeyi çekiyoruz (Filtreleme yok!)
        const data = await fetchLivePrices(); 
        setAllStocks(data);
        setIsFetching(false);

        // Eğer tablodan "Ekle"ye basıldıysa (initialSymbol varsa)
        if (initialSymbol) {
          setSearchTerm(initialSymbol);
          const found = data.find(s => s.name === initialSymbol);
          if (found) {
            setFormData({
              symbol: found.name,
              quantity: '',
              price: found.price
            });
            setSelectedStockInfo(found);
          }
        } else {
          // Yeni ekleme ise formu temizle
          setFormData({ symbol: '', quantity: '', price: '' });
          setSearchTerm('');
          setSelectedStockInfo(null);
        }
      }
    };
    initializeModal();
  }, [isOpen, initialSymbol]);

  // ARAMA FİLTRELEME (API'den gelen dev liste içinde arar)
  const filteredStocks = allStocks.filter(stock => 
    stock.name.includes(searchTerm.toUpperCase())
  ).slice(0, 10);

  // HİSSE SEÇME İŞLEMİ
  const handleStockSelect = (stock) => {
    setSearchTerm(stock.name);
    setFormData({
      ...formData,
      symbol: stock.name,
      price: stock.price
    });
    setSelectedStockInfo(stock);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.symbol) {
      alert('Lütfen listeden geçerli bir hisse seçin kanka!');
      return;
    }
    // Portföye ekle
    buyStock(formData.symbol, formData.quantity, formData.price);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* MODAL HEADER */}
        <div className="modal-header">
          <h2>{initialSymbol ? `${initialSymbol} Üzerine Ekle` : 'Yeni Hisse Ara ve Ekle'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          {/* HİSSE ARAMA ALANI (SEARCH ENGINE) */}
          <div className="form-group search-container">
            <label>Hisse Ara (Tüm Borsa İstanbul)</label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} 
              />
              <input 
                type="text" 
                placeholder="Hisse kodu yazın (Örn: THYAO)"
                required
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value.toUpperCase());
                  setShowDropdown(true);
                  if (e.target.value === '') setFormData({...formData, symbol: ''});
                }}
                onFocus={() => setShowDropdown(true)}
                readOnly={!!initialSymbol}
                style={{ 
                  paddingLeft: '40px',
                  background: initialSymbol ? 'var(--bg-main)' : '',
                  opacity: initialSymbol ? 0.7 : 1
                }}
              />
              {isFetching && (
                <Loader 
                  size={16} 
                  className="spin-animation" 
                  style={{ position: 'absolute', right: '12px', top: '12px' }} 
                />
              )}
            </div>

            {/* ARAMA SONUÇLARI (DROPDOWN) */}
            {showDropdown && searchTerm && !initialSymbol && (
              <div className="search-dropdown">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map(stock => (
                    <div 
                      key={stock.name} 
                      className="search-item"
                      onMouseDown={() => handleStockSelect(stock)}
                    >
                      <div className="search-item-info">
                        <span className="search-symbol">{stock.name}</span>
                        <span className="search-price">{stock.price} TL</span>
                      </div>
                      <span className={`search-rate ${stock.rate >= 0 ? 'text-success' : 'text-danger'}`}>
                        {stock.rate >= 0 ? '+' : ''}{stock.rate}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="search-item" style={{ cursor: 'default', color: 'var(--text-secondary)' }}>
                    Hisse bulunamadı...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ANLIK FİYAT ÖNİZLEME (OPSİYONEL) */}
          {selectedStockInfo && (
            <div className="live-price-preview">
              <span><strong>{selectedStockInfo.name}</strong> Güncel Değer:</span>
              <strong style={{ color: selectedStockInfo.rate >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedStockInfo.price)}
              </strong>
            </div>
          )}

          {/* ADET VE FİYAT INPUTLARI */}
          <div className="form-row">
            <div className="form-group">
              <label>Adet</label>
              <input 
                type="number" 
                required 
                min="1"
                step="1"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Alış Fiyatı (TL)</label>
              <input 
                type="number" 
                required 
                min="0.01"
                step="0.01"
                placeholder="250.50"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button type="submit" className="submit-btn">
            Portföye Ekle
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;