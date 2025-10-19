import type { AvailableFilter } from '../types';

/**
 * HuggingFace API Service
 * Handles communication with HuggingFace Inference API
 */

const HUGGINGFACE_API_URL =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

interface HuggingFaceResponse {
  generated_text: string;
}

/**
 * Builds the prompt for the LLM with business rules and filter context
 */
function buildPrompt(
  userQuery: string,
  availableFilters: AvailableFilter[],
): string {
  return `You are a product filter assistant. Convert user queries into structured filter JSON.

AVAILABLE FILTERS:
${JSON.stringify(availableFilters, null, 2)}

BUSINESS RULES - CAPACITY MAPPING:
- "small family" OR "2-3 people" → capacity: 4.0-4.5 cu ft
- "big family" OR "large family" OR "4+ people" → capacity: 5.0+ cu ft
- "apartment" OR "compact" → capacity: 3.5-4.2 cu ft
- "family sized" → capacity: 4.5+ cu ft

BUSINESS RULES - PRICE MAPPING:
- "under $X" OR "below $X" OR "less than $X" → price maxValue: X
- "above $X" OR "over $X" OR "more than $X" → price minValue: X
- "around $X" OR "about $X" → price minValue: X-200, maxValue: X+200
- "budget" → priceTier: BUDGET
- "affordable" → priceTier: BUDGET or MID_RANGE
- "premium" OR "high-end" → priceTier: PREMIUM
- "luxury" → priceTier: LUXURY

BUSINESS RULES - FEATURES:
- "energy efficient" OR "eco-friendly" → energyRating: A_PLUS_PLUS or A_PLUS_PLUS_PLUS
- "WiFi" OR "smart" OR "connected" → features.wifiEnabled: true
- "quiet" OR "silent" → noiseLevel: maxValue 60
- "steam" → features.steamCleaning: true
- "allergen" OR "allergy" → features.allergenCycle: true
- "sanitize" OR "antibacterial" → features.sanitizeCycle: true

ATTRIBUTE PATHS FOR FEATURES (IMPORTANT):
- WiFi: "features.wifiEnabled"
- Smart Diagnosis: "features.smartDiagnosis"
- Steam Cleaning: "features.steamCleaning"
- Allergen Cycle: "features.allergenCycle"
- Sanitize Cycle: "features.sanitizeCycle"
- Energy Star: "features.energyStarCertified"
- Stainless Steel Drum: "features.stainlessSteelDrum"
- Direct Drive Motor: "features.directDriveMotor"

USER QUERY: "${userQuery}"

INSTRUCTIONS:
1. Extract filter requirements from the user query
2. Map to available filters using business rules above
3. Use exact attribute names from AVAILABLE FILTERS
4. For features, use full path like "features.wifiEnabled"
5. Return ONLY valid JSON, no explanations

OUTPUT FORMAT (JSON ONLY):
{
  "rangeFilters": [
    { "attribute": "price", "minValue": 500, "maxValue": 1000 }
  ],
  "standardFilters": [
    { "attribute": "priceTier", "operator": "OR", "valueType": "SINGLE", "values": ["BUDGET"] },
    { "attribute": "features.wifiEnabled", "operator": "AND", "valueType": "SINGLE", "values": ["true"] }
  ],
  "confidence": 0.85
}

Return ONLY the JSON object, nothing else.`;
}

/**
 * Extracts JSON from LLM response
 * Handles cases where LLM wraps JSON in markdown code blocks or adds text
 */
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // Find JSON object boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON object found in response');
  }

  return cleaned.substring(jsonStart, jsonEnd + 1);
}

/**
 * Calls HuggingFace API with retry logic
 */
export async function callHuggingFace(
  userQuery: string,
  availableFilters: AvailableFilter[],
  retries = 2,
): Promise<any> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
  }

  const prompt = buildPrompt(userQuery, availableFilters);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.3, // Lower temperature for more consistent JSON
            top_p: 0.95,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HuggingFace API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();

      // HuggingFace returns array of responses
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format from HuggingFace');
      }

      const generatedText = data[0].generated_text;

      // Extract and parse JSON
      const jsonText = extractJSON(generatedText);
      const parsedResult = JSON.parse(jsonText);

      console.log('✅ HuggingFace API call successful');
      console.log('📊 Filter confidence:', parsedResult.confidence || 'N/A');

      return parsedResult;
    } catch (error) {
      console.error(`❌ HuggingFace API attempt ${attempt + 1} failed:`, error);

      // If this was the last retry, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt)),
      );
    }
  }

  throw new Error('All HuggingFace API retry attempts failed');
}
