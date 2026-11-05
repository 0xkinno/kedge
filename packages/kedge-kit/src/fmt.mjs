// Prose formatting for tPOT. Prose shows three decimals at most; FACTS and tables marked "exact" keep the full value.
export const fmtTpot = (x) => String(parseFloat(Number(x).toFixed(3)));
export const fmtTpotUnit = (x) => `${fmtTpot(x)} tPOT`;
