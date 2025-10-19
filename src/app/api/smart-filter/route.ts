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

    console.log('🔍 Smart filter request:', prompt);

    // Call HuggingFace API with retry logic
    let response: SmartFilterResponse;

    try {
      response = await callHuggingFace(prompt, availableFilters);
    } catch (huggingFaceError) {
      console.error('❌ HuggingFace API failed, attempting fallback...');

      // Fallback to rule-based parsing
      response = ruleBasedFallback(prompt);
      console.log('⚠️ Using rule-based fallback');
    }

    // Validate response structure
    if (!response.rangeFilters || !response.standardFilters) {
      console.error('❌ Invalid response structure:', response);
      return NextResponse.json(
        { error: 'Failed to parse filters from query' },
        { status: 500 },
      );
    }

    // Log confidence for debugging
    if (response.confidence) {
      console.log(`📊 Filter confidence: ${response.confidence}`);
    }

    console.log('✅ Smart filter response:', {
      rangeFilters: response.rangeFilters.length,
      standardFilters: response.standardFilters.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Smart filter API error:', error);

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
 * Rule-based fallback when HuggingFace API fails
 * Uses regex patterns to extract basic filters
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
      attribute: 'capacity',
      minValue: 4.0,
      maxValue: 4.5,
    });
  }

  if (/(big family|large family|4\+ people|family of \d+)/.test(lowerPrompt)) {
    rangeFilters.push({
      attribute: 'capacity',
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
      attribute: 'energyRating',
      operator: 'OR',
      valueType: 'MULTI',
      values: ['A_PLUS_PLUS', 'A_PLUS_PLUS_PLUS'],
    });
  }

  if (/(quiet|silent|low noise)/.test(lowerPrompt)) {
    rangeFilters.push({
      attribute: 'noiseLevel',
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
    confidence: 0.5, // Lower confidence for fallback
  };
}
