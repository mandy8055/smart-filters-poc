import { generateMockProductsByCategory } from '@/lib/utils/mock-data-generator';
import { writeFileSync } from 'fs';

// Generate 50 washing machines
const products = generateMockProductsByCategory(50, 'Washing_Machines');

writeFileSync('src/lib/mocks/products.json', JSON.stringify(products, null, 2));

console.log(`✅ Generated ${products.length} washing machine products`);
console.log(`   -> src/lib/mocks/products.json`);
