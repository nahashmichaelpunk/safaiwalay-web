/**
 * Single source for service pricing display labels and booking calculations.
 * Matches business rules: unit-based, per sq.ft, per KW, water tank slabs.
 */

export type ServicePricingMode =
  | 'unit'
  | 'sqft'
  | 'kw'
  | 'water_tank';

export interface BookingPricingMetadata {
  mode: ServicePricingMode;
  /** Human-readable line for cart/checkout */
  summary: string;
  quantity?: number;
  sqft?: number;
  kw?: number;
  tankType?: 'plastic' | 'concrete';
  capacityLiters?: number;
  /** For tanks above 10,000L: number of ₹1499 blocks charged */
  waterTankBlocks10000?: number;
}

export interface PricingInputs {
  quantity?: number;
  sqft?: number;
  kw?: number;
  tankType?: 'plastic' | 'concrete';
  capacityLiters?: number;
}

const RATE_SQFT = 12;
const RATE_KW = 100;
const WATER_PLASTIC_UP_TO_L = 2000;
const WATER_SMALL_FLAT = 600;
const WATER_BLOCK_FLAT = 1499;
const WATER_LARGE_THRESHOLD_L = 10000;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Detect pricing mode from service name (flexible matching). */
export function getPricingMode(serviceName: string): ServicePricingMode {
  const n = normalizeName(serviceName);
  if (n.includes('water tank')) return 'water_tank';
  if (n.includes('solar')) return 'kw';
  if (n.includes('patio') || n.includes('parking') || n.includes('terrace') || n.includes('roof')) {
    return 'sqft';
  }
  if (n.includes('car wash') || n.includes('carpet')) return 'unit';
  return 'unit';
}

/**
 * Water tank pricing:
 * - Plastic up to 2000L: ₹600 flat
 * - Above 2000L and up to 10000L (plastic or concrete): ₹1499 flat
 * - Above 10000L (plastic or concrete): ₹1499 per started 10000L block (ceil)
 */
export function calculateWaterTankPrice(
  tankType: 'plastic' | 'concrete',
  capacityLiters: number
): { price: number; blocks10000?: number } {
  const L = capacityLiters;
  if (!Number.isFinite(L) || L <= 0) {
    return { price: 0 };
  }
  if (tankType === 'plastic' && L <= WATER_PLASTIC_UP_TO_L) {
    return { price: WATER_SMALL_FLAT };
  }
  if (L > WATER_LARGE_THRESHOLD_L) {
    const blocks = Math.ceil(L / WATER_LARGE_THRESHOLD_L);
    return { price: blocks * WATER_BLOCK_FLAT, blocks10000: blocks };
  }
  return { price: WATER_BLOCK_FLAT };
}

/** Fallback label when DB `price_description` is empty. */
export function getPricingLabelFallback(serviceName: string): string {
  const mode = getPricingMode(serviceName);
  switch (mode) {
    case 'unit':
      return 'Per unit';
    case 'sqft':
      return `₹${RATE_SQFT} per sq.ft`;
    case 'kw':
      return `₹${RATE_KW} per KW`;
    case 'water_tank':
      return `Plastic up to ${WATER_PLASTIC_UP_TO_L}L: ₹${WATER_SMALL_FLAT}; ₹2001L–10,000L: ₹${WATER_BLOCK_FLAT}; above 10,000L: ₹${WATER_BLOCK_FLAT} per started 10,000L`;
    default:
      return '';
  }
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute final booking price and summary from service name + DB base price + inputs.
 */
export function calculateBookingPrice(
  serviceName: string,
  basePricePerUnit: number,
  inputs: PricingInputs
): { price: number; metadata: BookingPricingMetadata } {
  const mode = getPricingMode(serviceName);
  const qty = Math.max(1, Math.floor(inputs.quantity ?? 1));

  if (mode === 'unit') {
    const price = roundMoney(basePricePerUnit * qty);
    return {
      price,
      metadata: {
        mode: 'unit',
        summary: qty > 1 ? `${qty} units × ₹${basePricePerUnit}` : `1 unit × ₹${basePricePerUnit}`,
        quantity: qty
      }
    };
  }

  if (mode === 'sqft') {
    const sqft = inputs.sqft ?? 0;
    const price = roundMoney(RATE_SQFT * sqft);
    return {
      price,
      metadata: {
        mode: 'sqft',
        summary: `${sqft} sq.ft × ₹${RATE_SQFT}/sq.ft`,
        sqft
      }
    };
  }

  if (mode === 'kw') {
    const kw = inputs.kw ?? 0;
    const price = roundMoney(RATE_KW * kw);
    return {
      price,
      metadata: {
        mode: 'kw',
        summary: `${kw} KW × ₹${RATE_KW}/KW`,
        kw
      }
    };
  }

  // water_tank
  const tankType = inputs.tankType ?? 'plastic';
  const liters = inputs.capacityLiters ?? 0;
  const { price, blocks10000 } = calculateWaterTankPrice(tankType, liters);

  let summary: string;
  if (tankType === 'plastic' && liters > 0 && liters <= WATER_PLASTIC_UP_TO_L) {
    summary = `Plastic tank ≤${WATER_PLASTIC_UP_TO_L}L — flat ₹${WATER_SMALL_FLAT}`;
  } else if (liters > WATER_LARGE_THRESHOLD_L && blocks10000 !== undefined) {
    summary = `${tankType} tank ${liters}L — ${blocks10000} × ₹${WATER_BLOCK_FLAT} (per started 10,000L)`;
  } else {
    summary = `${tankType} tank ${liters}L — flat ₹${WATER_BLOCK_FLAT}`;
  }

  return {
    price,
    metadata: {
      mode: 'water_tank',
      summary,
      tankType,
      capacityLiters: liters,
      ...(blocks10000 !== undefined ? { waterTankBlocks10000: blocks10000 } : {})
    }
  };
}

/** Validate inputs for a mode; returns first error message or null. */
export function validatePricingInputs(
  serviceName: string,
  inputs: PricingInputs
): string | null {
  const mode = getPricingMode(serviceName);
  if (mode === 'unit') {
    const q = inputs.quantity ?? 1;
    if (!Number.isFinite(q) || q < 1) return 'Enter quantity (at least 1).';
    return null;
  }
  if (mode === 'sqft') {
    const s = inputs.sqft ?? 0;
    if (!Number.isFinite(s) || s <= 0) return 'Enter area in sq.ft (greater than 0).';
    return null;
  }
  if (mode === 'kw') {
    const k = inputs.kw ?? 0;
    if (!Number.isFinite(k) || k <= 0) return 'Enter solar capacity in KW (greater than 0).';
    return null;
  }
  if (mode === 'water_tank') {
    if (!inputs.tankType) return 'Select tank type (plastic or concrete).';
    const L = inputs.capacityLiters ?? 0;
    if (!Number.isFinite(L) || L <= 0) return 'Enter tank capacity in liters (greater than 0).';
    return null;
  }
  return null;
}
