import type { AvailableFilter } from './types';

/**
 * Available filters for washing machines
 * This configuration defines all filterable attributes in the product catalog
 * Used by both the UI (FilterPanel) and the Smart Filter API
 */
export const availableFilters: AvailableFilter[] = [
  // ============================================================================
  // RANGE FILTERS
  // ============================================================================

  {
    type: 'RANGE',
    attribute: 'price',
    displayName: 'Price',
    valueType: 'SINGLE',
    minValue: 330,
    maxValue: 7500,
    unit: 'USD',
  },

  {
    type: 'RANGE',
    attribute: 'capacity',
    displayName: 'Capacity',
    valueType: 'SINGLE',
    minValue: 3.5,
    maxValue: 6.2,
    unit: 'cu ft',
  },

  {
    type: 'RANGE',
    attribute: 'noiseLevel',
    displayName: 'Noise Level',
    valueType: 'SINGLE',
    minValue: 45,
    maxValue: 72,
    unit: 'dB',
  },

  {
    type: 'RANGE',
    attribute: 'spinSpeed',
    displayName: 'Spin Speed',
    valueType: 'SINGLE',
    minValue: 1000,
    maxValue: 1800,
    unit: 'RPM',
  },

  // ============================================================================
  // STANDARD FILTERS - Single Select
  // ============================================================================

  {
    type: 'STANDARD',
    attribute: 'priceTier',
    displayName: 'Price Tier',
    valueType: 'SINGLE',
    operator: 'OR',
    entries: [
      { value: 'BUDGET', displayValue: 'Budget (Under $1000)', count: 15 },
      {
        value: 'MID_RANGE',
        displayValue: 'Mid-Range ($1000-$3000)',
        count: 20,
      },
      { value: 'PREMIUM', displayValue: 'Premium ($3000-$5000)', count: 12 },
      { value: 'LUXURY', displayValue: 'Luxury ($5000+)', count: 3 },
    ],
  },

  // ============================================================================
  // STANDARD FILTERS - Multi Select
  // ============================================================================

  {
    type: 'STANDARD',
    attribute: 'brand',
    displayName: 'Brand',
    valueType: 'MULTI',
    operator: 'OR',
    entries: [
      { value: 'KITCHENTECH', displayValue: 'KitchenTech', count: 12 },
      { value: 'HOMEPRO', displayValue: 'HomePro', count: 13 },
      { value: 'APPLIANCE_PLUS', displayValue: 'Appliance Plus', count: 10 },
      { value: 'COOKMASTER', displayValue: 'CookMaster', count: 10 },
      { value: 'HOMEMATE', displayValue: 'HomeMate', count: 5 },
    ],
  },

  {
    type: 'STANDARD',
    attribute: 'color',
    displayName: 'Color',
    valueType: 'MULTI',
    operator: 'OR',
    entries: [
      { value: 'WHITE', displayValue: 'White', count: 22 },
      { value: 'BLACK', displayValue: 'Black', count: 16 },
      { value: 'SILVER', displayValue: 'Silver', count: 12 },
    ],
  },

  {
    type: 'STANDARD',
    attribute: 'energyRating',
    displayName: 'Energy Rating',
    valueType: 'MULTI',
    operator: 'OR',
    entries: [
      { value: 'A_PLUS_PLUS_PLUS', displayValue: 'A+++', count: 1 },
      { value: 'A_PLUS_PLUS', displayValue: 'A++', count: 12 },
      { value: 'A_PLUS', displayValue: 'A+', count: 18 },
      { value: 'A', displayValue: 'A', count: 14 },
      { value: 'B', displayValue: 'B', count: 5 },
    ],
  },

  // ============================================================================
  // FEATURE FILTERS (Boolean)
  // ============================================================================

  {
    type: 'STANDARD',
    attribute: 'features.wifiEnabled',
    displayName: 'WiFi Enabled',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 24 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.smartDiagnosis',
    displayName: 'Smart Diagnosis',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 25 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.steamCleaning',
    displayName: 'Steam Cleaning',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 30 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.allergenCycle',
    displayName: 'Allergen Cycle',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 28 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.sanitizeCycle',
    displayName: 'Sanitize Cycle',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 32 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.energyStarCertified',
    displayName: 'Energy Star Certified',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 35 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.stainlessSteelDrum',
    displayName: 'Stainless Steel Drum',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 32 }],
  },

  {
    type: 'STANDARD',
    attribute: 'features.directDriveMotor',
    displayName: 'Direct Drive Motor',
    valueType: 'SINGLE',
    operator: 'AND',
    entries: [{ value: 'true', displayValue: 'Yes', count: 28 }],
  },
];
