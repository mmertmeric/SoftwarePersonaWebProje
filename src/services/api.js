// src/services/api.js
const BASE_URL = 'https://api.collectapi.com/economy/liveBorsa';

export const fetchLivePrices = async () => {
  try {
    // Kullanıcı kendi API Key'ini girdiyse onu kullan, yoksa default olanı al
    const userApiKey = localStorage.getItem('bist_api_key');
    const API_KEY = userApiKey || 'apikey 0T4CAl9vdGYTPqBSwxm2oZ:79s4aTGW392pqnmC1M8swT'; 

    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': API_KEY
      }
    });

    if (!response.ok) throw new Error('API Key Hatası veya Limit Aşımı!');

    const data = await response.json();
    
    if (data.success && data.result) {
      return data.result; 
    }
    return [];
  } catch (error) {
    console.error("API Çekilemedi:", error);
    return [];
  }
};