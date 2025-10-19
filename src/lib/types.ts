// ============================================================================
// ENUMS
// ============================================================================

export type Brand =
  | 'KITCHENTECH'
  | 'HOMEPRO'
  | 'APPLIANCE_PLUS'
  | 'COOKMASTER'
  | 'HOMEMATE';

export type Color = 'WHITE' | 'SILVER' | 'BLACK';

export type PriceTier = 'BUDGET' | 'MID_RANGE' | 'PREMIUM' | 'LUXURY';

export type EnergyRating =
  | 'A_PLUS_PLUS_PLUS'
  | 'A_PLUS_PLUS'
  | 'A_PLUS'
  | 'A'
  | 'B';

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface ProductFamily {
  id: string;
  name: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Price {
  displayPrice: Money;
}

export interface ProductSpecifications {
  capacity: number; // cu ft
  energyRating: EnergyRating;
  noiseLevel: number; // dB
  spinSpeed: number; // RPM
  width: number; // inches
  height: number; // inches
  depth: number; // inches
  weight: number; // pounds
}

export interface ProductFeatures {
  wifiEnabled: boolean;
  smartDiagnosis: boolean;
  voiceControl: boolean;
  energyStarCertified: boolean;
  waterSenseApproved: boolean;
  steamCleaning: boolean;
  allergenCycle: boolean;
  quickWash: boolean;
  sanitizeCycle: boolean;
  stainlessSteelDrum: boolean;
  directDriveMotor: boolean;
}

export interface Product {
  id: string;
  brand: Brand;
  color: Color;
  price: Price;
  productFamily: ProductFamily;
  priceTier: PriceTier;
  specifications: ProductSpecifications;
  features: ProductFeatures;
  description: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export type FilterType = 'RANGE' | 'STANDARD';
export type FilterValueType = 'SINGLE' | 'MULTI';
export type FilterOperator = 'OR' | 'AND';

export interface FilterEntry {
  value: string;
  displayValue: string;
  count: number;
}

export interface AvailableFilter {
  type: FilterType;
  attribute: string;
  displayName: string;
  valueType: FilterValueType;
  operator?: FilterOperator;

  // For RANGE filters
  minValue?: number;
  maxValue?: number;
  unit?: string;

  // For STANDARD filters
  entries?: FilterEntry[];
}

// ============================================================================
// SMART FILTER API TYPES
// ============================================================================

export interface RangeFilter {
  attribute: string;
  minValue?: number;
  maxValue?: number;
}

export interface StandardFilter {
  attribute: string;
  operator: FilterOperator;
  valueType: FilterValueType;
  values: string[];
}

export interface SmartFilterRequest {
  prompt: string;
  availableFilters: AvailableFilter[];
}

export interface SmartFilterResponse {
  rangeFilters: RangeFilter[];
  standardFilters: StandardFilter[];
  confidence?: number; // Optional - for console.log only
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AppliedFilters {
  rangeFilters: Map<string, { min?: number; max?: number }>;
  standardFilters: Map<string, Set<string>>;
}
