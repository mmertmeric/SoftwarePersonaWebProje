// src/utils/sectorMapping.js
export const BIST_SECTORS = {
    TEKNOLOJI: ["ASELS", "KONTR", "MIATK", "REEDR", "YEOTK"],
    ENERJI: ["TUPRS", "ASTOR", "CWENE", "ENJSA", "ODAS", "AKFYE"],
    BANKACILIK: ["AKBNK", "GARAN", "ISCTR", "YKBNK", "HALKB"],
    SANAYI: ["EREGL", "KRDMD", "SASA", "HEKTS", "SISE", "TOASO", "FROTO"],
    ULASTIRMA: ["THYAO", "PGSUS", "CLEBI", "GSDHO"],
    HOLDING: ["KCHOL", "SAHOL", "ALARK", "DOAS"],
    GIDA_PERAKENDE: ["BIMAS", "CCOLA", "MGROS", "SOKM"]
  };
  
  export const getSectorBySymbol = (symbol) => {
    for (const [sector, symbols] of Object.entries(BIST_SECTORS)) {
      if (symbols.includes(symbol)) return sector;
    }
    return "DIGER";
  };