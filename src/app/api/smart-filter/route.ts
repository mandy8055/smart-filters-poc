import { NextRequest, NextResponse } from 'next/server';
import { callHuggingFace } from '@/lib/services/huggingface';
import { availableFilters } from '@/lib/available-filters';
import type { SmartFilterRequest, SmartFilterResponse } from '@/lib/types';

/**
 * POST /api/smart-filter
 * Converts natural language queries to structured filters using HuggingFace AI
 */
export async function POST(request: NextRequest) {
  try {
    const body: SmartFilterRequest = await request.json();
    const { prompt } = body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt is too long (max 500 characters)' },
        { status: 400 },
      );
    }

    // Pre-validation - Check if query contains washing machine related terms
    if (!isValidWashingMachineQuery(prompt)) {
      console.log('⚠️ Query rejected:', prompt);
      return NextResponse.json(
        {
          error:
            "I couldn't find any washing machine-related terms in your query.",
          suggestion:
            'Try using terms like: small family, big family, energy efficient, budget, premium, WiFi, quiet, steam cleaning',
        },
        { status: 400 },
      );
    }

    console.log('🔍 Processing query:', prompt);

    // Call HuggingFace API with retry logic
    let response: SmartFilterResponse;

    try {
      response = await callHuggingFace(prompt, availableFilters);

      // Check if AI returned empty filters
      if (
        response.rangeFilters.length === 0 &&
        response.standardFilters.length === 0
      ) {
        console.log('⚠️ AI returned empty filters');

        return NextResponse.json(
          {
            error:
              'Could not understand your query. Please try describing what you are looking for.',
            suggestion:
              'Try using terms like: budget, premium, small family, big family, energy efficient, WiFi, quiet',
          },
          { status: 400 },
        );
      }

      // Check confidence score
      if (response.confidence !== undefined && response.confidence < 0.3) {
        console.log(`⚠️ Low confidence: ${response.confidence}`);

        return NextResponse.json(
          {
            error:
              "I'm not confident I understood your query correctly. Could you try rephrasing?",
            suggestion:
              'Try using clearer terms like: "small family under $800", "energy efficient", "premium WiFi enabled"',
          },
          { status: 400 },
        );
      }

      // Fix common AI mistakes
      response = normalizeFilterResponse(response);
    } catch (huggingFaceError) {
      console.error('❌ AI failed, using fallback');

      // Fallback to rule-based parsing
      response = ruleBasedFallback(prompt);

      // If fallback also returns empty, inform user
      if (
        response.rangeFilters.length === 0 &&
        response.standardFilters.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              'Could not process your query. Please try again with clearer terms.',
            suggestion:
              'Examples: "small family", "budget friendly", "energy efficient with WiFi"',
          },
          { status: 400 },
        );
      }
    }

    // Validate response structure
    if (!response.rangeFilters || !response.standardFilters) {
      console.error('❌ Invalid response structure');
      return NextResponse.json(
        { error: 'Failed to parse filters from query' },
        { status: 500 },
      );
    }

    console.log('✅ Filters applied:', {
      range: response.rangeFilters.length,
      standard: response.standardFilters.length,
      confidence: response.confidence,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process smart filter request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Pre-validation: Check if query contains washing machine related terms
 */
function isValidWashingMachineQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();

  const validKeywords = [
    // Size/Family
    'small',
    'big',
    'large',
    'compact',
    'family',
    'people',
    'apartment',
    'space',
    // Price
    'budget',
    'cheap',
    'affordable',
    'expensive',
    'premium',
    'luxury',
    'under',
    'over',
    'around',
    'below',
    'above',
    '$',
    'dollar',
    'price',
    // Features
    'wifi',
    'smart',
    'energy',
    'efficient',
    'eco',
    'green',
    'quiet',
    'silent',
    'steam',
    'allergen',
    'sanitize',
    'wash',
    'clean',
    'cycle',
    // Specifications
    'capacity',
    'noise',
    'spin',
    'speed',
    'rating',
    'drum',
    'motor',
    // Brands
    'kitchentech',
    'homepro',
    'appliance',
    'cookmaster',
    'homemate',
    // Product types
    'washer',
    'washing',
    'machine',
    'appliance',
    'laundry',
  ];

  const hasValidKeyword = validKeywords.some((keyword) =>
    lowerPrompt.includes(keyword),
  );

  const hasNumbers = /\d/.test(prompt);

  return hasValidKeyword || (hasNumbers && lowerPrompt.length < 50);
}

/**
 * Rule-based fallback when HuggingFace API fails
 */
function ruleBasedFallback(prompt: string): SmartFilterResponse {
  const lowerPrompt = prompt.toLowerCase();
  const rangeFilters: SmartFilterResponse['rangeFilters'] = [];
  const standardFilters: SmartFilterResponse['standardFilters'] = [];

  // Price patterns
  const priceUnderMatch = lowerPrompt.match(
    /(?:under|below|less than|<)\s*\$?(\d+)/,
  );
  const priceOverMatch = lowerPrompt.match(
    /(?:over|above|more than|>)\s*\$?(\d+)/,
  );
  const priceAroundMatch = lowerPrompt.match(
    /(?:around|about|approximately)\s*\$?(\d+)/,
  );

  if (priceUnderMatch) {
    rangeFilters.push({
      attribute: 'price',
      maxValue: parseInt(priceUnderMatch[1]),
    });
  } else if (priceOverMatch) {
    rangeFilters.push({
      attribute: 'price',
      minValue: parseInt(priceOverMatch[1]),
    });
  } else if (priceAroundMatch) {
    const price = parseInt(priceAroundMatch[1]);
    rangeFilters.push({
      attribute: 'price',
      minValue: price - 200,
      maxValue: price + 200,
    });
  }

  // Price tier keywords
  if (/(^|\s)(budget|cheap|affordable|inexpensive)(\s|$)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'priceTier',
      operator: 'OR',
      valueType: 'SINGLE',
      values: ['BUDGET'],
    });
  }

  if (/(^|\s)(premium|high-end|expensive)(\s|$)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'priceTier',
      operator: 'OR',
      valueType: 'SINGLE',
      values: ['PREMIUM'],
    });
  }

  if (/(^|\s)(luxury|top-of-the-line)(\s|$)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'priceTier',
      operator: 'OR',
      valueType: 'SINGLE',
      values: ['LUXURY'],
    });
  }

  // Family size / capacity
  if (/(small family|2-3 people|couple)/.test(lowerPrompt)) {
    rangeFilters.push({
      attribute: 'specifications.capacity',
      minValue: 4.0,
      maxValue: 4.5,
    });
  }

  if (/(big family|large family|4\+ people|family of \d+)/.test(lowerPrompt)) {
    rangeFilters.push({
      attribute: 'specifications.capacity',
      minValue: 5.0,
    });
  }

  // Features
  if (/(wifi|smart|connected)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'features.wifiEnabled',
      operator: 'AND',
      valueType: 'SINGLE',
      values: ['true'],
    });
  }

  if (/(energy efficient|eco-friendly|energy star)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'specifications.energyRating',
      operator: 'OR',
      valueType: 'MULTI',
      values: ['A_PLUS_PLUS', 'A_PLUS_PLUS_PLUS'],
    });
  }

  if (/(quiet|silent|low noise)/.test(lowerPrompt)) {
    rangeFilters.push({
      attribute: 'specifications.noiseLevel',
      maxValue: 60,
    });
  }

  if (/(steam|steam clean)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'features.steamCleaning',
      operator: 'AND',
      valueType: 'SINGLE',
      values: ['true'],
    });
  }

  if (/(allergen|allergy)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'features.allergenCycle',
      operator: 'AND',
      valueType: 'SINGLE',
      values: ['true'],
    });
  }

  if (/(sanitize|antibacterial)/.test(lowerPrompt)) {
    standardFilters.push({
      attribute: 'features.sanitizeCycle',
      operator: 'AND',
      valueType: 'SINGLE',
      values: ['true'],
    });
  }

  return {
    rangeFilters,
    standardFilters,
    confidence: 0.5,
  };
}

/**
 * Normalizes AI response by fixing common mistakes
 */
function normalizeFilterResponse(response: any): SmartFilterResponse {
  const normalized: SmartFilterResponse = {
    rangeFilters: [],
    standardFilters: response.standardFilters || [],
    confidence: response.confidence,
  };

  const attributePathFixes: { [key: string]: string } = {
    energyRating: 'specifications.energyRating',
    capacity: 'specifications.capacity',
    noiseLevel: 'specifications.noiseLevel',
    spinSpeed: 'specifications.spinSpeed',
  };

  const standardFilterAttributes = [
    'priceTier',
    'brand',
    'color',
    'specifications.energyRating',
    'energyRating',
    'features.wifiEnabled',
    'features.smartDiagnosis',
    'features.steamCleaning',
    'features.allergenCycle',
    'features.sanitizeCycle',
    'features.energyStarCertified',
    'features.stainlessSteelDrum',
    'features.directDriveMotor',
  ];

  // Process rangeFilters
  response.rangeFilters?.forEach((filter: any) => {
    let attribute = filter.attribute;
    if (attributePathFixes[attribute]) {
      attribute = attributePathFixes[attribute];
    }

    if (
      standardFilterAttributes.includes(attribute) ||
      standardFilterAttributes.includes(filter.attribute)
    ) {
      normalized.standardFilters.push({
        attribute: attribute,
        operator: filter.operator || 'OR',
        valueType: filter.valueType || 'SINGLE',
        values: filter.values || [],
      });
    } else {
      normalized.rangeFilters.push({
        attribute: attribute,
        minValue: filter.minValue,
        maxValue: filter.maxValue,
      });
    }
  });

  // Process standardFilters - fix paths
  normalized.standardFilters = normalized.standardFilters.map((filter) => {
    let attribute = filter.attribute;
    if (attributePathFixes[attribute]) {
      attribute = attributePathFixes[attribute];
    }
    return {
      ...filter,
      attribute,
    };
  });

  return normalized;
}
