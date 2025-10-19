import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { id, brand, price, priceTier, specifications, features, description } =
    product;

  // Brand display names
  const brandNames: Record<string, string> = {
    KITCHENTECH: 'KitchenTech',
    HOMEPRO: 'HomePro',
    APPLIANCE_PLUS: 'Appliance Plus',
    COOKMASTER: 'CookMaster',
    HOMEMATE: 'HomeMate',
  };

  // Price tier badges
  const tierColors: Record<string, string> = {
    BUDGET: 'bg-green-100 text-green-800',
    MID_RANGE: 'bg-blue-100 text-blue-800',
    PREMIUM: 'bg-purple-100 text-purple-800',
    LUXURY: 'bg-amber-100 text-amber-800',
  };

  const tierLabels: Record<string, string> = {
    BUDGET: 'Budget',
    MID_RANGE: 'Mid-Range',
    PREMIUM: 'Premium',
    LUXURY: 'Luxury',
  };

  // Energy rating display
  const energyRatingDisplay = specifications.energyRating
    .replace('A_PLUS_PLUS_PLUS', 'A+++')
    .replace('A_PLUS_PLUS', 'A++')
    .replace('A_PLUS', 'A+');

  // Key features to display
  const keyFeatures = [];
  if (features.wifiEnabled) keyFeatures.push('WiFi');
  if (features.steamCleaning) keyFeatures.push('Steam');
  if (features.allergenCycle) keyFeatures.push('Allergen');
  if (features.energyStarCertified) keyFeatures.push('Energy Star');

  return (
    <div className='bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200'>
      {/* Product Image Placeholder */}
      <div className='relative bg-gray-100 h-48 flex items-center justify-center'>
        <img
          src={`https://placehold.co/300x200/e5e7eb/111827?text=${brand}`}
          alt={`${brandNames[brand]} Washer`}
          className='w-full h-full object-cover'
        />
        {/* Price Tier Badge */}
        <div className='absolute top-2 right-2'>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${tierColors[priceTier]}`}
          >
            {tierLabels[priceTier]}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className='p-4'>
        {/* Brand & Model */}
        <div className='mb-2'>
          <h3 className='font-semibold text-gray-900'>{brandNames[brand]}</h3>
          <p className='text-sm text-gray-500'>{id}</p>
        </div>

        {/* Price */}
        <div className='mb-3'>
          <span className='text-2xl font-bold text-gray-900'>
            ${price.displayPrice.amount.toLocaleString()}
          </span>
        </div>

        {/* Key Specs */}
        <div className='grid grid-cols-2 gap-2 mb-3 text-sm'>
          <div>
            <span className='text-gray-500'>Capacity:</span>
            <span className='ml-1 font-medium'>
              {specifications.capacity} cu ft
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Energy:</span>
            <span className='ml-1 font-medium'>{energyRatingDisplay}</span>
          </div>
          <div>
            <span className='text-gray-500'>Noise:</span>
            <span className='ml-1 font-medium'>
              {specifications.noiseLevel} dB
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Spin:</span>
            <span className='ml-1 font-medium'>
              {specifications.spinSpeed} RPM
            </span>
          </div>
        </div>

        {/* Description */}
        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{description}</p>

        {/* Key Features Tags */}
        {keyFeatures.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-3'>
            {keyFeatures.map((feature) => (
              <span
                key={feature}
                className='px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded'
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* View Details Button */}
        <button className='w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium'>
          View Details
        </button>
      </div>
    </div>
  );
}
