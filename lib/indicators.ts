/**
 * Cálculo de médias móveis sem dependências externas.
 * Retorna array do mesmo tamanho da entrada com `null` quando não há
 * candles suficientes para computar o valor.
 */

export function ema(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return values.map(() => null);
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      // Seed com SMA do primeiro período
      const slice = values.slice(i - period + 1, i + 1);
      const seed = slice.reduce((s, v) => s + v, 0) / period;
      prev = seed;
      out.push(seed);
    } else {
      prev = values[i] * k + prev * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

export function sma(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return values.map(() => null);
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  if (period <= 0 || values.length <= period) return values.map(() => null);
  const out: (number | null)[] = [];
  
  let avgGain = 0;
  let avgLoss = 0;

  // Primeiro cálculo
  let firstGains = 0;
  let firstLosses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) {
      firstGains += diff;
    } else {
      firstLosses -= diff;
    }
  }

  avgGain = firstGains / period;
  avgLoss = firstLosses / period;

  // Preenche null para os primeiros 'period' elementos
  for (let i = 0; i < period; i++) {
    out.push(null);
  }
  
  const rsFirst = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push(100 - (100 / (1 + rsFirst)));

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - (100 / (1 + rs)));
  }

  return out;
}

