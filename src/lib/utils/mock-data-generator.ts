import type { Product, Brand, Color, PriceTier, EnergyRating } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BRANDS: Brand[] = [
  'KITCHENTECH',
  'HOMEPRO',
  'APPLIANCE_PLUS',
  'COOKMASTER',
  'HOMEMATE',
];

const COLORS: Color[] = ['WHITE', 'SILVER', 'BLACK'];

const ENERGY_RATINGS: EnergyRating[] = [
  'A_PLUS_PLUS_PLUS',
  'A_PLUS_PLUS',
  'A_PLUS',
  'A',
  'B',
];

// ============================================================================
// 🔧 CHANGED: Exact distribution targets from handoff doc
// ============================================================================

const PRICE_TIER_TARGETS = {
  BUDGET: 15, // 30% - under $1000
  MID_RANGE: 20, // 40% - $1000-$3000
  PREMIUM: 12, // 24% - $3000-$5000
  LUXURY: 3, // 6% - over $5000
} as const;

const BRAND_TARGETS = {
  KITCHENTECH: 12, // 24%
  HOMEPRO: 13, // 26%
  APPLIANCE_PLUS: 10, // 20%
  COOKMASTER: 10, // 20%
  HOMEMATE: 5, // 10%
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// ============================================================================
// 🔧 CHANGED: Guaranteed price within tier range
// ============================================================================

function getPriceForTier(tier: PriceTier): number {
  switch (tier) {
    case 'BUDGET':
      return randomInt(330, 999); // Under $1000
    case 'MID_RANGE':
      return randomInt(1000, 2999); // $1000-$3000
    case 'PREMIUM':
      return randomInt(3000, 4999); // $3000-$5000
    case 'LUXURY':
      return randomInt(5000, 7500); // Over $5000
  }
}

function getCapacityForTier(tier: PriceTier): number {
  switch (tier) {
    case 'BUDGET':
      return randomFloat(3.5, 4.2);
    case 'MID_RANGE':
      return randomFloat(4.0, 4.8);
    case 'PREMIUM':
      return randomFloat(4.5, 5.5);
    case 'LUXURY':
      return randomFloat(5.5, 6.2);
  }
}

function getEnergyRatingForTier(tier: PriceTier): EnergyRating {
  switch (tier) {
    case 'BUDGET':
      return randomChoice(['B', 'A'] as EnergyRating[]);
    case 'MID_RANGE':
      return randomChoice(['A', 'A_PLUS'] as EnergyRating[]);
    case 'PREMIUM':
      return randomChoice(['A_PLUS', 'A_PLUS_PLUS'] as EnergyRating[]);
    case 'LUXURY':
      return randomChoice([
        'A_PLUS_PLUS',
        'A_PLUS_PLUS_PLUS',
      ] as EnergyRating[]);
  }
}

function getFeaturesForTier(tier: PriceTier) {
  const baseChance =
    tier === 'BUDGET'
      ? 0.2
      : tier === 'MID_RANGE'
      ? 0.5
      : tier === 'PREMIUM'
      ? 0.8
      : 0.95;

  return {
    wifiEnabled: Math.random() < baseChance,
    smartDiagnosis: Math.random() < baseChance,
    voiceControl: Math.random() < baseChance * 0.7,
    energyStarCertified: Math.random() < baseChance + 0.2,
    waterSenseApproved: Math.random() < baseChance,
    steamCleaning: Math.random() < baseChance,
    allergenCycle: Math.random() < baseChance,
    quickWash: Math.random() < baseChance + 0.3,
    sanitizeCycle: Math.random() < baseChance,
    stainlessSteelDrum: Math.random() < baseChance + 0.1,
    directDriveMotor: Math.random() < baseChance,
  };
}

function generateDescription(
  brand: Brand,
  tier: PriceTier,
  capacity: number,
  features: any,
): string {
  const brandNames: { [key in Brand]: string } = {
    KITCHENTECH: 'KitchenTech',
    HOMEPRO: 'HomePro',
    APPLIANCE_PLUS: 'Appliance Plus',
    COOKMASTER: 'CookMaster',
    HOMEMATE: 'HomeMate',
  };

  const tierDescriptions: { [key in PriceTier]: string } = {
    BUDGET: 'Reliable and affordable',
    MID_RANGE: 'Feature-rich and dependable',
    PREMIUM: 'Premium quality with advanced features',
    LUXURY: 'Top-of-the-line luxury appliance',
  };

  let description = `${tierDescriptions[tier]} front-load washer from ${brandNames[brand]}. `;

  if (capacity >= 5.0) {
    description += `Extra-large ${capacity} cu ft capacity perfect for families. `;
  } else if (capacity >= 4.5) {
    description += `Spacious ${capacity} cu ft capacity for everyday loads. `;
  } else {
    description += `Compact ${capacity} cu ft capacity ideal for apartments. `;
  }

  const smartFeatures = [];
  if (features.wifiEnabled) smartFeatures.push('WiFi connectivity');
  if (features.steamCleaning) smartFeatures.push('steam cleaning');
  if (features.allergenCycle) smartFeatures.push('allergen removal');
  if (features.sanitizeCycle) smartFeatures.push('sanitize cycle');

  if (smartFeatures.length > 0) {
    description += `Features ${smartFeatures.join(
      ', ',
    )} for superior cleaning. `;
  }

  if (features.stainlessSteelDrum && features.directDriveMotor) {
    description +=
      'Built with stainless steel drum and direct drive motor for durability.';
  } else if (features.stainlessSteelDrum) {
    description += 'Durable stainless steel drum construction.';
  }

  return description.trim();
}

// ============================================================================
// 🔧 NEW: Main generation function with controlled distribution
// ============================================================================

export function generateProducts(): Product[] {
  const products: Product[] = [];

  // Create distribution plan: array of [brand, tier] pairs
  const distributionPlan: Array<[Brand, PriceTier]> = [];

  // Step 1: Create tier distribution (15 budget, 20 mid, 12 premium, 3 luxury)
  const tierOrder: PriceTier[] = [
    ...Array(PRICE_TIER_TARGETS.BUDGET).fill('BUDGET'),
    ...Array(PRICE_TIER_TARGETS.MID_RANGE).fill('MID_RANGE'),
    ...Array(PRICE_TIER_TARGETS.PREMIUM).fill('PREMIUM'),
    ...Array(PRICE_TIER_TARGETS.LUXURY).fill('LUXURY'),
  ] as PriceTier[];

  // Step 2: Assign brands to meet brand distribution
  let brandCounts = {
    KITCHENTECH: 0,
    HOMEPRO: 0,
    APPLIANCE_PLUS: 0,
    COOKMASTER: 0,
    HOMEMATE: 0,
  };

  for (const tier of tierOrder) {
    // Find brands that still need products
    const availableBrands = BRANDS.filter(
      (brand) => brandCounts[brand] < BRAND_TARGETS[brand],
    );

    // Pick a random available brand
    const brand =
      availableBrands.length > 0
        ? randomChoice(availableBrands)
        : randomChoice(BRANDS);

    brandCounts[brand]++;
    distributionPlan.push([brand, tier]);
  }

  // Step 3: Generate products from distribution plan
  distributionPlan.forEach(([brand, tier], index) => {
    const capacity = getCapacityForTier(tier);
    const price = getPriceForTier(tier);
    const specifications = {
      capacity,
      energyRating: getEnergyRatingForTier(tier),
      noiseLevel:
        tier === 'BUDGET'
          ? randomInt(65, 72)
          : tier === 'MID_RANGE'
          ? randomInt(58, 64)
          : tier === 'PREMIUM'
          ? randomInt(52, 57)
          : randomInt(45, 51),
      spinSpeed:
        tier === 'BUDGET'
          ? randomChoice([1000, 1100, 1200])
          : tier === 'MID_RANGE'
          ? randomChoice([1200, 1300, 1400])
          : tier === 'PREMIUM'
          ? randomChoice([1400, 1500, 1600])
          : randomChoice([1600, 1700, 1800]),
      width: randomInt(27, 30),
      height: randomInt(38, 42),
      depth: randomInt(30, 34),
      weight: randomInt(180, 250),
    };

    const features = getFeaturesForTier(tier);

    const product: Product = {
      id: `WM_${String(index + 1).padStart(4, '0')}`,
      brand,
      color: randomChoice(COLORS),
      price: {
        displayPrice: {
          amount: price,
          currency: 'USD',
        },
      },
      productFamily: {
        id: 'Washing_Machines',
        name: 'Washers',
      },
      priceTier: tier,
      specifications,
      features,
      description: generateDescription(brand, tier, capacity, features),
    };

    products.push(product);
  });

  return products;
}

// ============================================================================
// 🔧 CHANGED: Simplified - now just calls generateProducts()
// ============================================================================

export function generateMockProductsByCategory(
  count: number,
  categoryId: string,
): Product[] {
  // For washing machines, ignore count and always generate exact 50
  if (categoryId === 'Washing_Machines') {
    return generateProducts();
  }

  // Fallback for other categories (not used in POC)
  return generateProducts().slice(0, count);
}
