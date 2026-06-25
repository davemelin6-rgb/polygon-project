// lib/sectorBenchmarks.js
// Sector-specific normalization ranges for TECH VALUE scoring.
// Stocks are benchmarked against their own sector peers, not cross-sector.
// This prevents software margins from making semiconductor/defence stocks look weak.

export const TICKER_SECTORS = {
  // Quantum computing — early stage, high R&D, low/negative margins expected
  IONQ: "quantum", RGTI: "quantum", QUBT: "quantum", QBTS: "quantum",

  // Semiconductors — hardware margins structurally lower than software
  NVDA: "semiconductors", AMD: "semiconductors", SMCI: "semiconductors",
  INTC: "semiconductors", AVGO: "semiconductors", QCOM: "semiconductors",
  TSM:  "semiconductors", ASML: "semiconductors",

  // Software / Cloud — high gross margins, high R&D
  MSFT: "software", META: "software", PLTR: "software", AI: "software",
  SOUN: "software", SNOW: "software", CRM: "software", NOW: "software",
  GOOGL: "software",

  // Defence & Space — cost-plus contracts, low gross margins by design
  LMT: "defence", RTX: "defence", NOC: "defence", GD: "defence",
  BA:  "defence", RKLB: "defence", ASTS: "defence", KTOS: "defence",

  // Biotech & MedTech — very high R&D intensity, variable margins
  LLY: "biotech", NVO: "biotech", MRNA: "biotech", REGN: "biotech",
  VRTX: "biotech", GILD: "biotech", ISRG: "biotech", DXCM: "biotech",

  // General tech (default for unknown tickers)
  AAPL: "tech", AMZN: "tech", TSLA: "tech", IBM: "tech",

  // Crypto — use quantum ranges (high volatility, wide normalization expected)
  "X:BTCUSD": "quantum", "X:ETHUSD": "quantum", "X:SOLUSD": "quantum",
  "X:XRPUSD": "quantum", "X:BNBUSD": "quantum", "X:ADAUSD": "quantum",
  "X:AVAXUSD": "quantum", "X:DOGEUSD": "quantum", "X:DOTUSD": "quantum",
  "X:LINKUSD": "quantum",
};

// Normalization ranges per sector: [poor_end, excellent_end]
// A stock at excellent_end scores 100, at poor_end scores 0.
export const SECTOR_BENCHMARKS = {

  software: {
    grossMargin: [0.50, 0.85],  // 50% = below avg, 85% = exceptional
    netMargin:   [0.02, 0.35],
    rdIntensity: [0.08, 0.30],
    revGrowth:   [-0.05, 0.50],
    fcfMargin:   [0.02, 0.35],
    roe:         [-0.05, 0.45],
  },

  semiconductors: {
    grossMargin: [0.35, 0.70],  // AMD at 50% = middle of the pack, not weak
    netMargin:   [0.05, 0.35],
    rdIntensity: [0.08, 0.25],
    revGrowth:   [-0.10, 0.60], // semis can have explosive growth cycles
    fcfMargin:   [0.02, 0.30],
    roe:         [-0.05, 0.45],
  },

  quantum: {
    grossMargin: [0.10, 0.70],  // wide range — some have no revenue yet
    netMargin:   [-0.80, 0.05], // losing money is expected at this stage
    rdIntensity: [0.20, 0.80],  // very high R&D is the norm
    revGrowth:   [-0.20, 1.50], // hypergrowth or zero — very wide range
    fcfMargin:   [-0.80, 0.05],
    roe:         [-0.80, 0.05],
  },

  defence: {
    grossMargin: [0.08, 0.28],  // cost-plus contracts = structurally low margins
    netMargin:   [0.04, 0.16],
    rdIntensity: [0.01, 0.08],  // R&D often funded by government contracts
    revGrowth:   [-0.05, 0.15], // steady, not hypergrowth
    fcfMargin:   [0.02, 0.14],
    roe:         [0.05, 0.30],
  },

  biotech: {
    grossMargin: [0.50, 0.88],  // drugs have very high gross margins
    netMargin:   [-0.20, 0.40], // R&D-heavy companies may lose money
    rdIntensity: [0.12, 0.50],  // heavy R&D is the moat
    revGrowth:   [-0.10, 0.50],
    fcfMargin:   [-0.15, 0.35],
    roe:         [-0.20, 0.45],
  },

  tech: {
    // General tech fallback for unknown tickers
    grossMargin: [0.35, 0.78],
    netMargin:   [0.03, 0.32],
    rdIntensity: [0.05, 0.25],
    revGrowth:   [-0.10, 0.50],
    fcfMargin:   [0.02, 0.30],
    roe:         [-0.05, 0.40],
  },
};

export function getSectorBenchmarks(ticker) {
  const sector = TICKER_SECTORS[ticker?.toUpperCase()] || "tech";
  return SECTOR_BENCHMARKS[sector] || SECTOR_BENCHMARKS.tech;
}

// Median P/E ratio per sector — used for valuation label (cheap/fair/expensive)
export const SECTOR_PE = {
  software:      35,
  semiconductors: 28,
  quantum:        null, // most are pre-earnings, P/E meaningless
  defence:        20,
  biotech:        25,
  tech:           28,
};

export function getSectorPE(ticker) {
  const sector = TICKER_SECTORS[ticker?.toUpperCase()] || "tech";
  return SECTOR_PE[sector] ?? 25;
}

// ── Sector Demand Scores (editorial, updated quarterly) ──────────
// Estimates 1-5 year technology demand trajectory per sector.
// Based on: analyst consensus, government spending direction,
// technology adoption stage (S-curve positioning), and market research.
// Range 0-100: 100 = explosive demand growth ahead, 0 = declining/obsolete.
export const SECTOR_DEMAND_SCORES = {
  quantum:        88,  // Early adoption phase — massive projected growth, government investment
  ai:             82,  // High growth but becoming competitive; infrastructure still expanding
  semiconductors: 76,  // Essential infrastructure, cyclical but structural tailwind (AI chips)
  defence:        80,  // Strong government tailwinds, geopolitical spending increase
  biotech:        78,  // Aging population, GLP-1, gene therapy — decade-long tailwind
  tech:           72,  // General tech — mature but still growing
};

// Sector ETF tickers for demand momentum signal (all on Polygon)
export const SECTOR_ETFS = {
  quantum:        "ARKQ",  // ARK Space Exploration & Innovation (proxy)
  ai:             "QQQ",   // Nasdaq 100 — AI/tech proxy
  semiconductors: "SOXX",  // iShares Semiconductor
  defence:        "XAR",   // SPDR Aerospace & Defence
  biotech:        "IBB",   // iShares Biotechnology
  tech:           "QQQ",
};

export function getSectorDemandScore(ticker) {
  const sector = TICKER_SECTORS[ticker?.toUpperCase()] || "tech";
  return SECTOR_DEMAND_SCORES[sector] ?? 70;
}

export function getSectorETF(ticker) {
  const sector = TICKER_SECTORS[ticker?.toUpperCase()] || "tech";
  return SECTOR_ETFS[sector] ?? "QQQ";
}
