'use client';

import { useState } from 'react';
import type { AppliedFilters } from '@/lib/types';
import { availableFilters } from '@/lib/available-filters';

interface FilterPanelProps {
  appliedFilters: AppliedFilters;
  onFilterChange: (filters: AppliedFilters) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function FilterPanel({
  appliedFilters,
  onFilterChange,
  isMobileOpen = false,
  onMobileClose,
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'priceTier', 'brand']),
  );

  const toggleSection = (attribute: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(attribute)) {
      newExpanded.delete(attribute);
    } else {
      newExpanded.add(attribute);
    }
    setExpandedSections(newExpanded);
  };

  const handleRangeChange = (
    attribute: string,
    type: 'min' | 'max',
    value: number,
  ) => {
    const newFilters = { ...appliedFilters };
    const current = newFilters.rangeFilters.get(attribute) || {};

    newFilters.rangeFilters.set(attribute, {
      ...current,
      [type === 'min' ? 'min' : 'max']: value,
    });

    onFilterChange(newFilters);
  };

  const handleStandardFilterToggle = (attribute: string, value: string) => {
    const newFilters = { ...appliedFilters };

    if (!newFilters.standardFilters.has(attribute)) {
      newFilters.standardFilters.set(attribute, new Set());
    }

    const values = newFilters.standardFilters.get(attribute)!;

    if (values.has(value)) {
      values.delete(value);
      if (values.size === 0) {
        newFilters.standardFilters.delete(attribute);
      }
    } else {
      values.add(value);
    }

    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({
      rangeFilters: new Map(),
      standardFilters: new Map(),
    });
  };

  const hasActiveFilters =
    appliedFilters.rangeFilters.size > 0 ||
    appliedFilters.standardFilters.size > 0;

  return (
    <div
      className={`
        bg-white border-r border-gray-200
        ${
          isMobileOpen
            ? 'fixed inset-0 z-50 overflow-y-auto'
            : 'hidden lg:block'
        }
      `}
    >
      {/* Mobile Header */}
      {isMobileOpen && (
        <div className='sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden'>
          <h2 className='text-lg font-semibold text-gray-900'>Filters</h2>
          <button
            onClick={onMobileClose}
            className='p-2 text-gray-400 hover:text-gray-600'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      )}

      <div className='p-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900 hidden lg:block'>
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className='text-sm text-blue-600 hover:text-blue-700 font-medium'
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter Sections */}
        <div className='space-y-4'>
          {availableFilters.map((filter) => {
            const isExpanded = expandedSections.has(filter.attribute);

            return (
              <div
                key={filter.attribute}
                className='border-b border-gray-200 pb-4 last:border-b-0'
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(filter.attribute)}
                  className='w-full flex items-center justify-between py-2 text-left'
                >
                  <span className='font-medium text-gray-900'>
                    {filter.displayName}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className='mt-2 space-y-2'>
                    {filter.type === 'RANGE' ? (
                      // Range Filter (Slider)
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <input
                            type='number'
                            placeholder='Min'
                            min={filter.minValue}
                            max={filter.maxValue}
                            value={
                              appliedFilters.rangeFilters.get(filter.attribute)
                                ?.min ?? ''
                            }
                            onChange={(e) =>
                              handleRangeChange(
                                filter.attribute,
                                'min',
                                parseFloat(e.target.value),
                              )
                            }
                            className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                          <span className='text-gray-400'>-</span>
                          <input
                            type='number'
                            placeholder='Max'
                            min={filter.minValue}
                            max={filter.maxValue}
                            value={
                              appliedFilters.rangeFilters.get(filter.attribute)
                                ?.max ?? ''
                            }
                            onChange={(e) =>
                              handleRangeChange(
                                filter.attribute,
                                'max',
                                parseFloat(e.target.value),
                              )
                            }
                            className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          />
                        </div>
                        {filter.unit && (
                          <p className='text-xs text-gray-500'>
                            Range: {filter.minValue} - {filter.maxValue}{' '}
                            {filter.unit}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Standard Filter (Checkboxes)
                      <div className='space-y-2'>
                        {filter.entries?.map((entry) => {
                          const isChecked =
                            appliedFilters.standardFilters
                              .get(filter.attribute)
                              ?.has(entry.value) ?? false;

                          return (
                            <label
                              key={entry.value}
                              className='flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded'
                            >
                              <input
                                type='checkbox'
                                checked={isChecked}
                                onChange={() =>
                                  handleStandardFilterToggle(
                                    filter.attribute,
                                    entry.value,
                                  )
                                }
                                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                              />
                              <span className='flex-1 text-sm text-gray-700'>
                                {entry.displayValue}
                              </span>
                              <span className='text-xs text-gray-400'>
                                ({entry.count})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
