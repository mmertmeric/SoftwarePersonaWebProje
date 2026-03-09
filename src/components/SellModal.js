import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import './TransactionModal.css';

const SellModal = ({ isOpen, onClose, stock }) => {
  const { sellStock } = usePortfolio();
  const [quantity, setQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  // Modal açıldığında değerleri sıfırla/varsayılana çek
  useEffect(() => {
    if (isOpen && stock) {
      setQuantity(stock.quantity); // Varsayılan olarak elindeki tüm lot sayısını getirir
      setSellPrice(''); // Satış fiyatı manuel girilsin
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const qty = parseFloat(quantity);
    const price = parseFloat(sellPrice);

    if (qty <= 0 || qty > stock.quantity) {
      alert("Geçersiz adet girdiniz!");
      return;
    }

    if (price <= 0) {
      alert("Geçerli bir satış fiyatı giriniz!");
      return;
    }

    // Context'e 3 parametreyi de yolluyoruz: Sembol, Adet, Satış Fiyatı
    sellStock(stock.symbol, qty, price);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2><TrendingDown size={24} color="#fb7185" /> Hisse Satışı: {stock.symbol}</h2>
          <button className="icon-btn" onClick={onClose} title="Kapat">
            <X size={24} />
          </button>
        </div>

        <div className="modal-warning" style={{ background: 'rgba(251, 113, 133, 0.1)', border: '1px solid #fb7185', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertTriangle size={20} color="#fb7185" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Mevcut Adet: <strong>{stock.quantity} Lot</strong> <br/>
            Ortalama Maliyet: <strong>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stock.averagePrice)}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Satılacak Adet (Lot)</label>
            <input 
              type="number" 
              step="0.01" 
              max={stock.quantity}
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Satış Fiyatı (TL)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Hisse başına satış fiyatı"
              value={sellPrice} 
              onChange={(e) => setSellPrice(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn" style={{ background: '#fb7185', marginTop: '15px' }}>
            Satışı Onayla ve Deftere Yaz
          </button>
        </form>

      </div>
    </div>
  );
};

export default SellModal;