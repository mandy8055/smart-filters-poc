'use client';

import { useState, useEffect } from 'react';
import { SmartFilterInput } from '@/components/SmartFilterInput';
import { FilterPanel } from '@/components/FilterPanel';
import { ProductGrid } from '@/components/ProductGrid';
import productsData from '@/lib/mocks/products.json';
import type { Product, AppliedFilters, SmartFilterResponse } from '@/lib/types';
import { shuffleArray } from '@/lib/utils/utility';

export default function Home() {
  // Shuffle products once on mount for more realistic display
  const [allProducts] = useState<Product[]>(() =>
    shuffleArray(productsData as Product[]),
  );
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(
    productsData as Product[],
  );
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    rangeFilters: new Map(),
    standardFilters: new Map(),
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Apply filters whenever appliedFilters changes
  useEffect(() => {
    const filtered = applyFilters(allProducts, appliedFilters);
    setFilteredProducts(filtered);
  }, [appliedFilters, allProducts]);

  // Handle smart filter response from AI
  const handleSmartFilterApply = (response: SmartFilterResponse) => {
    const newFilters: AppliedFilters = {
      rangeFilters: new Map(),
      standardFilters: new Map(),
    };

    // Convert range filters
    response.rangeFilters.forEach((rf) => {
      newFilters.rangeFilters.set(rf.attribute, {
        min: rf.minValue,
        max: rf.maxValue,
      });
    });

    // Convert standard filters
    response.standardFilters.forEach((sf) => {
      newFilters.standardFilters.set(sf.attribute, new Set(sf.values));
    });

    setAppliedFilters(newFilters);

    // Log confidence for debugging (not shown in UI)
    if (response.confidence) {
      console.log(`🎯 Filter applied with confidence: ${response.confidence}`);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setAppliedFilters({
      rangeFilters: new Map(),
      standardFilters: new Map(),
    });
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 sticky top-0 z-40'>
        <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Smart Product Filter - Washing Machines
            </h1>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className='lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                />
              </svg>
              Filters
              {appliedFilters.rangeFilters.size +
                appliedFilters.standardFilters.size >
                0 && (
                <span className='bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  {appliedFilters.rangeFilters.size +
                    appliedFilters.standardFilters.size}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6'>
          {/* Filter Sidebar - Desktop */}
          <aside className='hidden lg:block'>
            <div className='sticky top-24'>
              <FilterPanel
                appliedFilters={appliedFilters}
                onFilterChange={setAppliedFilters}
              />
            </div>
          </aside>

          {/* Filter Sidebar - Mobile */}
          {isMobileFilterOpen && (
            <FilterPanel
              appliedFilters={appliedFilters}
              onFilterChange={setAppliedFilters}
              isMobileOpen={isMobileFilterOpen}
              onMobileClose={() => setIsMobileFilterOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <main>
            {/* Smart Filter Input */}
            <SmartFilterInput
              onFilterApply={handleSmartFilterApply}
              onClear={handleClearFilters}
            />

            {/* Product Grid */}
            <ProductGrid
              products={filteredProducts}
              totalCount={allProducts.length}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Apply filters to products
 * Handles both range filters and standard filters
 */
function applyFilters(products: Product[], filters: AppliedFilters): Product[] {
  return products.filter((product) => {
    // Apply range filters
    for (const [attribute, range] of filters.rangeFilters) {
      const value = getNestedValue(product, attribute);

      if (typeof value !== 'number') continue;

      if (range.min !== undefined && value < range.min) return false;
      if (range.max !== undefined && value > range.max) return false;
    }

    // Apply standard filters
    for (const [attribute, values] of filters.standardFilters) {
      if (values.size === 0) continue;

      const productValue = getNestedValue(product, attribute);

      // Handle boolean values (features)
      if (typeof productValue === 'boolean') {
        // For boolean filters, we only check if "true" is selected
        if (values.has('true') && !productValue) return false;
        continue;
      }

      // Handle string values (brand, color, energyRating, priceTier, etc.)
      if (typeof productValue === 'string') {
        // Check if the product's value is in the selected values
        const hasMatch = Array.from(values).some((filterValue) => {
          return productValue === filterValue;
        });

        if (!hasMatch) return false;
        continue;
      }
    }

    return true;
  });
}

/**
 * Get nested value from object using dot notation
 * e.g., "features.wifiEnabled" -> product.features.wifiEnabled
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
