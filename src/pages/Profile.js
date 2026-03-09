// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { User, Key, Target, Code, Save, Database, Download, CheckCircle, Briefcase, FileText } from 'lucide-react';
import { fetchLivePrices } from '../services/api';
import { getSectorBySymbol } from '../utils/sectorMapping'; // Sektör verisi için eklendi
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { portfolio, watchlist } = usePortfolio();

  // Settings States
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [financialGoal, setFinancialGoal] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Canlı Veri ve Portföy Değeri
  const [currentValue, setCurrentValue] = useState(0);
  const [livePrices, setLivePrices] = useState({}); // PDF Raporu için anlık fiyatları tutuyoruz

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setProfession(user.profession || '');
    }

    const savedKey = localStorage.getItem('bist_api_key') || '';
    const savedGoal = localStorage.getItem('bist_financial_goal') || '500000';
    const savedDevMode = localStorage.getItem('bist_dev_mode') === 'true';
    
    setApiKey(savedKey);
    setFinancialGoal(savedGoal);
    setDevMode(savedDevMode);

    const calculateValueAndFetchPrices = async () => {
      const liveData = await fetchLivePrices();
      let total = 0;
      const pricesMap = {};
      
      portfolio.forEach(stock => {
        const liveStock = liveData.find(s => s.name === stock.symbol);
        const price = liveStock ? liveStock.price : stock.averagePrice;
        pricesMap[stock.symbol] = price;
        total += (stock.quantity * price);
      });
      
      setLivePrices(pricesMap);
      setCurrentValue(total);
    };

    if (portfolio.length > 0) {
      calculateValueAndFetchPrices();
    }
  }, [user, portfolio]);

  const handleSaveSettings = () => {
    updateProfile(fullName, profession);
    localStorage.setItem('bist_api_key', apiKey);
    localStorage.setItem('bist_financial_goal', financialGoal);
    localStorage.setItem('bist_dev_mode', devMode);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportData = () => {
    const backupData = {
      user: fullName,
      email: user?.email,
      profession: profession,
      date: new Date().toISOString(),
      portfolio,
      watchlist
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bist_portfolio_backup_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  // --- YENİ EKLENEN: PDF RAPORU OLUŞTURMA (Zero-Dependency) ---
  const handleGeneratePDF = () => {
    const totalCost = portfolio.reduce((acc, stock) => acc + (stock.quantity * stock.averagePrice), 0);
    const totalProfitLoss = currentValue - totalCost;
    const isProfit = totalProfitLoss >= 0;

    // Sektörel Analiz Hesaplaması
    const sectors = {};
    portfolio.forEach(stock => {
      const sector = getSectorBySymbol(stock.symbol);
      const val = stock.quantity * (livePrices[stock.symbol] || stock.averagePrice);
      sectors[sector] = (sectors[sector] || 0) + val;
    });
    
    const sectorHtml = Object.entries(sectors).map(([name, val]) => `
      <li><strong>${name}:</strong> ${formatCurrency(val)} (%${((val/currentValue)*100).toFixed(1)})</li>
    `).join('');

    // Tablo Satırları
    const tableRows = portfolio.map(stock => {
      const currentPrice = livePrices[stock.symbol] || stock.averagePrice;
      const investment = stock.quantity * stock.averagePrice;
      const currentVal = stock.quantity * currentPrice;
      const pl = currentVal - investment;
      const plClass = pl >= 0 ? 'success' : 'danger';
      const plSign = pl >= 0 ? '+' : '';

      return `
        <tr>
          <td><strong>${stock.symbol}</strong></td>
          <td>${stock.quantity}</td>
          <td>${formatCurrency(stock.averagePrice)}</td>
          <td>${formatCurrency(currentPrice)}</td>
          <td>${formatCurrency(investment)}</td>
          <td><strong>${formatCurrency(currentVal)}</strong></td>
          <td class="${plClass}">${plSign}${formatCurrency(pl)}</td>
        </tr>
      `;
    }).join('');

    // Yazdırılabilir HTML Şablonu (Geçici Pencere İçin)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>BIST Portföy Raporu - ${fullName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; background: #fff; line-height: 1.6; }
            .header { border-bottom: 2px solid #38bdf8; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { margin: 0; color: #0f172a; font-size: 24px; }
            .date-info { color: #64748b; font-size: 14px; text-align: right; }
            .summary-grid { display: flex; gap: 20px; margin-bottom: 30px; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; flex: 1; }
            .summary-box p { margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold; }
            .summary-box h2 { margin: 0; font-size: 22px; color: #0f172a; }
            .success { color: #16a34a !important; }
            .danger { color: #dc2626 !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
            .sector-list { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            ul { margin: 10px 0 0 0; padding-left: 20px; }
            li { margin-bottom: 5px; }
            .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>BIST Portföy Analiz Raporu</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Yatırımcı:</strong> ${fullName} <span style="color:#64748b;">(${profession})</span></p>
            </div>
            <div class="date-info">
              Rapor Tarihi: <strong>${new Date().toLocaleDateString('tr-TR')}</strong><br/>
              Oluşturulan Sistem: BIST Portfolio Tracker
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <p>Toplam Yatırım Maliyeti</p>
              <h2>${formatCurrency(totalCost)}</h2>
            </div>
            <div class="summary-box">
              <p>Güncel Portföy Değeri</p>
              <h2>${formatCurrency(currentValue)}</h2>
            </div>
            <div class="summary-box">
              <p>Net Kâr / Zarar Durumu</p>
              <h2 class="${isProfit ? 'success' : 'danger'}">
                ${isProfit ? '+' : ''}${formatCurrency(totalProfitLoss)}
              </h2>
            </div>
          </div>

          <div class="sector-list">
            <h3 style="margin: 0 0 10px 0; color: #0f172a;">Sektörel Dağılım Özeti</h3>
            <ul>
              ${sectorHtml || '<li>Henüz sektörel veri bulunmuyor.</li>'}
            </ul>
          </div>

          <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Portföy Detayları</h3>
          <table>
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Adet (Lot)</th>
                <th>Ort. Maliyet</th>
                <th>Anlık Fiyat</th>
                <th>Toplam Yatırım</th>
                <th>Güncel Değer</th>
                <th>Net Kâr/Zarar</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align:center;">Portföyünüzde henüz hisse bulunmuyor.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Bu rapor BIST Portfolio Tracker sistemi tarafından otomatik olarak üretilmiştir. Sadece bilgilendirme amaçlıdır, yatırım tavsiyesi niteliği taşımaz.
          </div>
          
          <script>
            // Render işlemi bitince otomatik yazdırma penceresini aç
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const goalValue = parseFloat(financialGoal) || 1; 
  const progressPercentage = Math.min((currentValue / goalValue) * 100, 100);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Hesap ve Sistem Ayarları</h1>
        <p>Tercihlerinizi yapılandırın ve portföy hedeflerinizi yönetin.</p>
      </div>

      <div className="profile-grid">
        {/* SOL KOLON */}
        <div className="settings-column">
          
          {/* Kişisel Bilgiler Kartı */}
          <div className="settings-card" style={{ marginBottom: '24px' }}>
            <h2><User size={20} /> Kişisel Bilgiler</h2>
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Ad Soyad</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız ve Soyadınız"
              />
            </div>

            <div className="form-group">
              <label>Meslek / Ünvan</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  value={profession} 
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Örn: Full-Stack Developer"
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Finansal Hedef Kartı */}
          <div className="settings-card" style={{ marginBottom: '24px' }}>
            <h2><Target size={20} /> Finansal Hedefim</h2>
            
            <div className="form-group">
              <label>Hedef Portföy Büyüklüğü (TL)</label>
              <input 
                type="number" 
                value={financialGoal} 
                onChange={(e) => setFinancialGoal(e.target.value)}
                placeholder="Örn: 500000"
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hedefe İlerleme Durumu</label>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div className="progress-stats">
                <span>Güncel: {formatCurrency(currentValue)}</span>
                <span>Hedef: {formatCurrency(goalValue)}</span>
              </div>
            </div>
          </div>

          {/* Veri Yönetimi ve Raporlama Kartı */}
          <div className="settings-card">
            <h2><Database size={20} /> Veri Yönetimi & Raporlama</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              Portföyünüzü tarayıcınızda (Local Storage) saklıyoruz. Verilerinizi dışa aktarabilir veya PDF raporu alabilirsiniz.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              {/* YENİ EKLENEN PDF BUTONU */}
              <button 
                className="export-btn" 
                style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none' }} 
                onClick={handleGeneratePDF}
              >
                <FileText size={18} /> Gelişmiş PDF Raporu Oluştur
              </button>
              
              <button className="export-btn" onClick={handleExportData}>
                <Download size={18} /> JSON Olarak Yedekle
              </button>
            </div>
          </div>

        </div>

        {/* SAĞ KOLON */}
        <div className="settings-column">
          
          {/* API ve Geliştirici Ayarları Kartı */}
          <div className="settings-card">
            <h2><Key size={20} /> Sistem Bağlantıları</h2>
            
            <div className="form-group">
              <label>CollectAPI Key (liveBorsa)</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Boş bırakılırsa varsayılan key kullanılır"
              />
              <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Full-stack projelerde limitleri yönetmek için kendi key'inizi kullanmanız önerilir.
              </small>
            </div>

            <div className="toggle-group" style={{ marginTop: '10px' }}>
              <div className="toggle-info">
                <span><Code size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }}/> Developer Mode</span>
                <small>State verilerini ham JSON formatında görüntüle</small>
              </div>
              <label className="switch">
                <input type="checkbox" checked={devMode} onChange={(e) => setDevMode(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            <button className="save-btn" onClick={handleSaveSettings}>
              <Save size={18} /> Ayarları Kaydet
            </button>
            
            {isSaved && (
              <div className="success-message">
                <CheckCircle size={16} /> Değişiklikler başarıyla kaydedildi!
              </div>
            )}
          </div>

          {/* Developer Mode Raw Data View */}
          {devMode && (
            <div className="raw-data-container">
              <span style={{ color: '#fff', fontSize: '0.8rem', display: 'block', marginBottom: '10px', opacity: 0.5 }}>
                // BIST_PORTFOLIO_STATE
              </span>
              <pre>
                {JSON.stringify({ 
                  activeUser: fullName,
                  profession: profession,
                  email: user?.email,
                  totalAssets: portfolio.length,
                  portfolioState: portfolio,
                  watchlistState: watchlist
                }, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;