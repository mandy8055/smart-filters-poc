import { HfInference } from '@huggingface/inference';
import type { AvailableFilter } from '../types';

/**
 * HuggingFace API Service using official SDK
 */

function buildPrompt(
  userQuery: string,
  availableFilters: AvailableFilter[],
): string {
  return `You are a product filter assistant. Convert user queries into structured filter JSON.

AVAILABLE FILTERS:
${JSON.stringify(availableFilters, null, 2)}

ATTRIBUTE PATHS (CRITICAL - USE EXACT PATHS):
- Energy Rating: "specifications.energyRating" (NOT "energyRating")
- Capacity: "specifications.capacity" (NOT "capacity")
- Noise Level: "specifications.noiseLevel" (NOT "noiseLevel")
- Spin Speed: "specifications.spinSpeed" (NOT "spinSpeed")
- Price Tier: "priceTier"
- Brand: "brand"
- Color: "color"
- WiFi: "features.wifiEnabled"
- Smart Diagnosis: "features.smartDiagnosis"
- Steam Cleaning: "features.steamCleaning"
- Allergen Cycle: "features.allergenCycle"
- Sanitize Cycle: "features.sanitizeCycle"
- Energy Star: "features.energyStarCertified"
- Stainless Steel Drum: "features.stainlessSteelDrum"
- Direct Drive Motor: "features.directDriveMotor"

BUSINESS RULES - CAPACITY MAPPING:
- "small family" OR "2-3 people" → specifications.capacity: 4.0-4.5 cu ft
- "big family" OR "large family" OR "4+ people" → specifications.capacity: 5.0+ cu ft
- "apartment" OR "compact" → specifications.capacity: 3.5-4.2 cu ft
- "family sized" → specifications.capacity: 4.5+ cu ft

BUSINESS RULES - PRICE MAPPING:
- "under $X" OR "below $X" OR "less than $X" → price maxValue: X
- "above $X" OR "over $X" OR "more than $X" → price minValue: X
- "around $X" OR "about $X" → price minValue: X-200, maxValue: X+200
- "budget" → priceTier: BUDGET
- "affordable" → priceTier: BUDGET or MID_RANGE
- "premium" OR "high-end" → priceTier: PREMIUM
- "luxury" → priceTier: LUXURY

BUSINESS RULES - FEATURES:
- "energy efficient" OR "eco-friendly" → specifications.energyRating: A_PLUS_PLUS or A_PLUS_PLUS_PLUS
- "WiFi" OR "smart" OR "connected" → features.wifiEnabled: true
- "quiet" OR "silent" → specifications.noiseLevel: maxValue 60
- "steam" → features.steamCleaning: true
- "allergen" OR "allergy" → features.allergenCycle: true
- "sanitize" OR "antibacterial" → features.sanitizeCycle: true

USER QUERY: "${userQuery}"

INSTRUCTIONS:
1. Extract filter requirements from the user query
2. Map to available filters using business rules above
3. Use EXACT attribute paths from ATTRIBUTE PATHS section
4. Return ONLY valid JSON, no explanations

OUTPUT FORMAT (JSON ONLY):
{
  "rangeFilters": [
    { "attribute": "price", "maxValue": 800 },
    { "attribute": "specifications.capacity", "minValue": 4.0, "maxValue": 4.5 }
  ],
  "standardFilters": [
    { "attribute": "priceTier", "operator": "OR", "valueType": "SINGLE", "values": ["BUDGET"] },
    { "attribute": "specifications.energyRating", "operator": "OR", "valueType": "MULTI", "values": ["A_PLUS_PLUS", "A_PLUS_PLUS_PLUS"] }
  ],
  "confidence": 0.85
}

Return ONLY the JSON object, nothing else.`;
}

function extractJSON(text: string): string {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON object found in response');
  }

  return cleaned.substring(jsonStart, jsonEnd + 1);
}

export async function callHuggingFace(
  userQuery: string,
  availableFilters: AvailableFilter[],
  retries = 2,
): Promise<any> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
  }

  console.log('🔑 Using HuggingFace Inference SDK');

  const hf = new HfInference(apiKey);
  const prompt = buildPrompt(userQuery, availableFilters);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🤖 HuggingFace API attempt ${attempt + 1}...`);

      // Use chatCompletion instead of textGeneration
      const result = await hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const generatedText = result.choices[0]?.message?.content || '';
      console.log('📦 Raw response:', generatedText.substring(0, 200));

      const jsonText = extractJSON(generatedText);
      const parsedResult = JSON.parse(jsonText);

      console.log('✅ HuggingFace SDK call successful');
      console.log('📊 Filter confidence:', parsedResult.confidence || 'N/A');

      return parsedResult;
    } catch (error) {
      console.error(`❌ HuggingFace SDK attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        throw error;
      }

      const waitTime = 1000 * Math.pow(2, attempt);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('All HuggingFace SDK retry attempts failed');
}
