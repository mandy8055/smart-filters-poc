'use client';

import { useState } from 'react';
import type { SmartFilterResponse } from '@/lib/types';

interface SmartFilterInputProps {
  onFilterApply: (filters: SmartFilterResponse) => void;
  onClear: () => void;
}

const QUICK_HINTS = [
  'Small family',
  'Big family',
  'Energy efficient',
  'WiFi enabled',
];

export function SmartFilterInput({
  onFilterApply,
  onClear,
}: SmartFilterInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/smart-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          availableFilters: [], // Filters are loaded in API route
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process filter');
      }

      const data: SmartFilterResponse = await response.json();
      onFilterApply(data);
    } catch (err) {
      console.error('Smart filter error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to process your query. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickHint = (hint: string) => {
    setPrompt(hint);
    setError(null);
  };

  const handleClear = () => {
    setPrompt('');
    setError(null);
    onClear();
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
      <div className='flex items-center gap-2 mb-4'>
        <svg
          className='w-5 h-5 text-blue-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
        <h2 className='text-lg font-semibold text-gray-900'>Smart Filter</h2>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Input */}
        <div>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError(null);
            }}
            placeholder="What are you looking for? E.g., '3 people family under $800'"
            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
          <div className='flex justify-between items-center mt-1'>
            <p className='text-xs text-gray-500'>
              Example: "3 people family under $800"
            </p>
            <p className='text-xs text-gray-400'>{prompt.length}/500</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2'>
            <svg
              className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <p className='text-sm text-red-800'>{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={isLoading || !prompt.trim()}
            className='flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
          >
            {isLoading ? (
              <span className='flex items-center justify-center gap-2'>
                <svg
                  className='animate-spin h-5 w-5'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'Apply Smart Filter'
            )}
          </button>

          <button
            type='button'
            onClick={handleClear}
            disabled={isLoading}
            className='px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Clear
          </button>
        </div>
      </form>

      {/* Quick Hints */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <p className='text-xs text-gray-500 mb-2 flex items-center gap-1'>
          <svg
            className='w-4 h-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 10V3L4 14h7v7l9-11h-7z'
            />
          </svg>
          Quick hints:
        </p>
        <div className='flex flex-wrap gap-2'>
          {QUICK_HINTS.map((hint) => (
            <button
              key={hint}
              type='button'
              onClick={() => handleQuickHint(hint)}
              disabled={isLoading}
              className='px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
