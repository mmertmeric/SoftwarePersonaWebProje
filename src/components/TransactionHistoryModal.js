import React from 'react';
import { X, History, FileText } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import './TransactionHistoryModal.css';

const TransactionHistoryModal = ({ isOpen, onClose }) => {
  const { transactions } = usePortfolio();

  if (!isOpen) return null;

  const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="history-header">
          <h2><History size={24} color="var(--accent)" /> İşlem Geçmişi Defteri</h2>
          <button className="icon-btn" onClick={onClose} title="Kapat">
            <X size={24} />
          </button>
        </div>

        <div className="history-body">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
              <p>Henüz kayıtlı bir işleminiz bulunmuyor.</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Yaptığınız tüm alım ve satım işlemleri burada listelenecektir.</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>İşlem Tipi</th>
                    <th>Sembol</th>
                    <th>Adet</th>
                    <th>İşlem Fiyatı</th>
                    <th>Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(tx.date)}</td>
                      <td>
                        <span className={`type-badge ${tx.type === 'ALIŞ' ? 'type-buy' : 'type-sell'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td><strong>{tx.symbol}</strong></td>
                      <td>{tx.quantity} Lot</td>
                      <td>{formatCurrency(tx.price)}</td>
                      <td><strong>{formatCurrency(tx.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;