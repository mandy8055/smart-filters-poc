'use client';

import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

interface ProductGridProps {
  products: Product[];
  totalCount: number;
}

export function ProductGrid({ products, totalCount }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className='col-span-full text-center py-16'>
        <div className='text-gray-400 mb-4'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No products found
        </h3>
        <p className='text-gray-500'>
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with count and sort */}
      <div className='flex items-center justify-between mb-6'>
        <div className='text-sm text-gray-600'>
          Showing{' '}
          <span className='font-medium text-gray-900'>{products.length}</span>{' '}
          of <span className='font-medium text-gray-900'>{totalCount}</span>{' '}
          products
        </div>

        {/* Sort dropdown - placeholder for now */}
        <div className='flex items-center gap-2'>
          <label htmlFor='sort' className='text-sm text-gray-600'>
            Sort by:
          </label>
          <select
            id='sort'
            className='border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='relevance'>Relevance</option>
            <option value='price-asc'>Price: Low to High</option>
            <option value='price-desc'>Price: High to Low</option>
            <option value='rating'>Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
