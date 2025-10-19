import { InferenceClient } from '@huggingface/inference';
import type { AvailableFilter } from '../types';

/**
 * HuggingFace API Service using official SDK (InferenceClient)
 */

function buildPrompt(
  userQuery: string,
  availableFilters: AvailableFilter[],
): string {
  return `You are a product filter assistant. Convert user queries into structured filter JSON.

⚠️ CRITICAL INSTRUCTION: Only add filters that are EXPLICITLY mentioned in the user's query. 
Do NOT make assumptions about what the user wants. If they say "small family", ONLY add capacity filter, NOT energy rating or other features.

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
⚠️ Apply capacity filter ONLY, do NOT add other filters unless explicitly mentioned:
- "small family" OR "2-3 people" → specifications.capacity: 4.0-4.5 cu ft (ONLY capacity, nothing else)
- "big family" OR "large family" OR "4+ people" → specifications.capacity: 5.0+ cu ft (ONLY capacity, nothing else)
- "apartment" OR "compact" → specifications.capacity: 3.5-4.2 cu ft
- "family sized" → specifications.capacity: 4.5+ cu ft

BUSINESS RULES - PRICE MAPPING:
- "under $X" OR "below $X" OR "less than $X" → price maxValue: X
- "above $X" OR "over $X" OR "more than $X" → price minValue: X
- "around $X" OR "about $X" → price minValue: X-200, maxValue: X+200
- "budget" OR "budget friendly" OR "affordable" → priceTier: BUDGET
- "mid-range" OR "mid range" → priceTier: MID_RANGE
- "premium" OR "high-end" OR "high end" → priceTier: PREMIUM
- "luxury" OR "top of the line" → priceTier: LUXURY

BUSINESS RULES - FEATURES (ONLY if explicitly mentioned):
⚠️ Do NOT add these filters unless user EXPLICITLY mentions the keyword:
- "energy efficient" OR "eco-friendly" OR "eco friendly" OR "green" → specifications.energyRating: A_PLUS_PLUS or A_PLUS_PLUS_PLUS
- "WiFi" OR "wifi" OR "smart" OR "connected" → features.wifiEnabled: true
- "quiet" OR "silent" OR "low noise" → specifications.noiseLevel: maxValue 60
- "steam" OR "steam clean" OR "steam cleaning" → features.steamCleaning: true
- "allergen" OR "allergy" → features.allergenCycle: true
- "sanitize" OR "antibacterial" OR "sanitizing" → features.sanitizeCycle: true
- "energy star" → features.energyStarCertified: true

USER QUERY: "${userQuery}"

STEP-BY-STEP INSTRUCTIONS:
1. Read the user query carefully
2. Identify ONLY the explicitly mentioned requirements
3. Map those requirements to filters using business rules above
4. Use EXACT attribute paths from ATTRIBUTE PATHS section
5. Do NOT add filters that are not explicitly mentioned in the query
6. Return ONLY valid JSON, no explanations

OUTPUT FORMAT (JSON ONLY):
{
  "rangeFilters": [
    { "attribute": "price", "maxValue": 800 },
    { "attribute": "specifications.capacity", "minValue": 4.0, "maxValue": 4.5 }
  ],
  "standardFilters": [
    { "attribute": "priceTier", "operator": "OR", "valueType": "SINGLE", "values": ["BUDGET"] }
  ],
  "confidence": 0.85
}

EXAMPLES:
Query: "small family"
Correct: { rangeFilters: [{ attribute: "specifications.capacity", minValue: 4.0, maxValue: 4.5 }], standardFilters: [], confidence: 0.9 }
Wrong: Adding energy rating or other features NOT mentioned

Query: "energy efficient"
Correct: { rangeFilters: [], standardFilters: [{ attribute: "specifications.energyRating", operator: "OR", valueType: "MULTI", values: ["A_PLUS_PLUS", "A_PLUS_PLUS_PLUS"] }], confidence: 1.0 }

Query: "small family under $800"
Correct: { rangeFilters: [{ attribute: "price", maxValue: 800 }, { attribute: "specifications.capacity", minValue: 4.0, maxValue: 4.5 }], standardFilters: [], confidence: 0.85 }

Query: "budget friendly small family"
Correct: { rangeFilters: [{ attribute: "specifications.capacity", minValue: 4.0, maxValue: 4.5 }], standardFilters: [{ attribute: "priceTier", operator: "OR", valueType: "SINGLE", values: ["BUDGET"] }], confidence: 0.9 }

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

  const client = new InferenceClient(apiKey);
  const prompt = buildPrompt(userQuery, availableFilters);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use chatCompletion with InferenceClient
      const result = await client.chatCompletion({
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
      const jsonText = extractJSON(generatedText);
      const parsedResult = JSON.parse(jsonText);

      return parsedResult;
    } catch (error) {
      console.error(
        `❌ AI attempt ${attempt + 1} failed:`,
        error instanceof Error ? error.message : 'Unknown error',
      );

      if (attempt === retries) {
        throw error;
      }

      const waitTime = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('All HuggingFace InferenceClient retry attempts failed');
}
