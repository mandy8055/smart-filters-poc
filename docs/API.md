# API Reference

Complete API documentation for the Smart Product Filter POC.

---

## Endpoints

### POST /api/smart-filter

Convert natural language query to structured product filters.

**URL:** `/api/smart-filter`  
**Method:** `POST`  
**Auth:** None required

---

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter          | Type              | Required | Description                            |
| ------------------ | ----------------- | -------- | -------------------------------------- |
| `prompt`           | string            | Yes      | Natural language query (max 500 chars) |
| `availableFilters` | AvailableFilter[] | No       | Auto-loaded in API route               |

### Request Example

```json
{
  "prompt": "small family under $800"
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "rangeFilters": [
    {
      "attribute": "price",
      "maxValue": 800
    },
    {
      "attribute": "specifications.capacity",
      "minValue": 4.0,
      "maxValue": 4.5
    }
  ],
  "standardFilters": [
    {
      "attribute": "priceTier",
      "operator": "OR",
      "valueType": "SINGLE",
      "values": ["BUDGET"]
    }
  ],
  "confidence": 0.85
}
```

### Error Response (400 Bad Request)

**Invalid Query:**

```json
{
  "error": "I couldn't find any washing machine-related terms in your query.",
  "suggestion": "Try using terms like: small family, big family, energy efficient, budget, premium, WiFi, quiet, steam cleaning"
}
```

**Low Confidence:**

```json
{
  "error": "I'm not confident I understood your query correctly. Could you try rephrasing?",
  "suggestion": "Try using clearer terms like: \"small family under $800\", \"energy efficient\", \"premium WiFi enabled\""
}
```

**Empty String:**

```json
{
  "error": "Prompt is required and must be a non-empty string"
}
```

**Too Long:**

```json
{
  "error": "Prompt is too long (max 500 characters)"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to process smart filter request",
  "details": "All HuggingFace API retry attempts failed"
}
```

---

## Response Fields

### RangeFilter

| Field       | Type              | Description                                                      |
| ----------- | ----------------- | ---------------------------------------------------------------- |
| `attribute` | string            | Filter attribute path (e.g., "price", "specifications.capacity") |
| `minValue`  | number (optional) | Minimum value                                                    |
| `maxValue`  | number (optional) | Maximum value                                                    |

### StandardFilter

| Field       | Type                | Description                                                          |
| ----------- | ------------------- | -------------------------------------------------------------------- |
| `attribute` | string              | Filter attribute path (e.g., "brand", "specifications.energyRating") |
| `operator`  | "OR" \| "AND"       | How to combine multiple values                                       |
| `valueType` | "SINGLE" \| "MULTI" | Single or multiple selection                                         |
| `values`    | string[]            | Array of filter values                                               |

### Additional Fields

| Field        | Type              | Description               |
| ------------ | ----------------- | ------------------------- |
| `confidence` | number (optional) | AI confidence score (0-1) |

---

## Pre-Validation

The API performs **pre-validation** before calling the AI to reject invalid queries instantly:

### Valid Query Requirements

A query is considered valid if it contains at least one of these:

**Keywords:**

- Size/Family: small, big, large, compact, family, people, apartment, space
- Price: budget, cheap, affordable, expensive, premium, luxury, under, over, around, $, dollar, price
- Features: wifi, smart, energy, efficient, eco, green, quiet, silent, steam, allergen, sanitize, wash, clean, cycle
- Specifications: capacity, noise, spin, speed, rating, drum, motor
- Brands: kitchentech, homepro, appliance, cookmaster, homemate
- Product types: washer, washing, machine, appliance, laundry

**OR**

- Contains numbers (e.g., "$800", "4.5") AND query is less than 50 characters

### Rejected Queries

❌ `"akndkand adnadnad"` - Gibberish  
❌ `"pizza delivery"` - Unrelated topic  
❌ `"weather tomorrow"` - Not about washing machines

**Benefit:** No AI call made, instant response, saves costs

---

## AI Processing

If pre-validation passes, the query is sent to HuggingFace AI (Mistral-7B-Instruct).

### AI Behavior

**Strict Instructions:**

- Only add filters **explicitly mentioned** in the query
- Do NOT make assumptions (e.g., "small family" ≠ energy efficient)
- Return empty filters if confidence is too low
- Use exact attribute paths from schema

**Example:**

```
Query: "small family"
Correct: Only capacity filter
Wrong: Adding energy rating (not mentioned)
```

### Retry Logic

- **3 attempts** with exponential backoff (1s, 2s, 4s)
- Falls back to **rule-based parsing** if all attempts fail
- Rule-based has lower confidence (0.5)

---

## Response Normalization

The API automatically fixes common AI mistakes:

### Path Corrections

| AI Returns     | Corrected To                  |
| -------------- | ----------------------------- |
| `energyRating` | `specifications.energyRating` |
| `capacity`     | `specifications.capacity`     |
| `noiseLevel`   | `specifications.noiseLevel`   |
| `spinSpeed`    | `specifications.spinSpeed`    |

### Filter Type Corrections

If AI places a standard filter in `rangeFilters`, it's automatically moved to `standardFilters`.

---

## Query Examples

### Example 1: Family Size + Budget

**Request:**

```json
{
  "prompt": "small family under $800"
}
```

**Response:**

```json
{
  "rangeFilters": [
    { "attribute": "price", "maxValue": 800 },
    { "attribute": "specifications.capacity", "minValue": 4.0, "maxValue": 4.5 }
  ],
  "standardFilters": [],
  "confidence": 0.85
}
```

### Example 2: Energy Efficiency

**Request:**

```json
{
  "prompt": "energy efficient"
}
```

**Response:**

```json
{
  "rangeFilters": [],
  "standardFilters": [
    {
      "attribute": "specifications.energyRating",
      "operator": "OR",
      "valueType": "MULTI",
      "values": ["A_PLUS_PLUS", "A_PLUS_PLUS_PLUS"]
    }
  ],
  "confidence": 1.0
}
```

### Example 3: Features + Price Tier

**Request:**

```json
{
  "prompt": "WiFi enabled premium washer"
}
```

**Response:**

```json
{
  "rangeFilters": [],
  "standardFilters": [
    {
      "attribute": "features.wifiEnabled",
      "operator": "AND",
      "valueType": "SINGLE",
      "values": ["true"]
    },
    {
      "attribute": "priceTier",
      "operator": "OR",
      "valueType": "SINGLE",
      "values": ["PREMIUM"]
    }
  ],
  "confidence": 0.9
}
```

### Example 4: Invalid Query

**Request:**

```json
{
  "prompt": "akndkand random gibberish"
}
```

**Response (400):**

```json
{
  "error": "I couldn't find any washing machine-related terms in your query.",
  "suggestion": "Try using terms like: small family, big family, energy efficient, budget, premium, WiFi, quiet, steam cleaning"
}
```

---

## Confidence Scores

| Score Range | Meaning                          | Source              |
| ----------- | -------------------------------- | ------------------- |
| 0.8 - 1.0   | High confidence (AI understands) | AI                  |
| 0.5 - 0.8   | Medium confidence                | AI                  |
| 0.5         | Low confidence                   | Rule-based fallback |
| < 0.3       | Rejected (too uncertain)         | Validation          |

---

## Status Codes

| Code | Meaning               | Description                                    |
| ---- | --------------------- | ---------------------------------------------- |
| 200  | OK                    | Request successful, filters returned           |
| 400  | Bad Request           | Invalid prompt, no valid terms, low confidence |
| 500  | Internal Server Error | AI processing failed, fallback also failed     |

---

## Rate Limiting

### HuggingFace API Limits

- **Free Tier:** ~1000 requests/day
- **Rate:** ~1 request/second
- **Retry:** Automatic (3 attempts with exponential backoff)

### Vercel Function Limits

- **Execution Time:** 10 seconds (Hobby plan)
- **Requests:** Unlimited (fair use)

---

## Error Handling

### Three-Tier Fallback System

```
1. Pre-validation (code)
   ├─ Check for valid keywords
   └─ Reject gibberish instantly

2. AI Processing (HuggingFace)
   ├─ Attempt 1 → Fail
   ├─ Attempt 2 → Fail
   ├─ Attempt 3 → Fail
   └─ Proceed to fallback

3. Rule-Based Fallback (regex)
   └─ Extract filters using patterns
```

### Fallback Behavior

If HuggingFace fails after 3 retries, the system uses regex patterns:

```
Pattern: /(small family|2-3 people)/
Match: "small family"
Action: Add capacity filter (4.0-4.5 cu ft)
Confidence: 0.5 (rule-based)
```

---

## Attribute Paths

### Range Filter Attributes

```
price                           # Product price ($)
specifications.capacity         # Capacity (cu ft)
specifications.noiseLevel       # Noise level (dB)
specifications.spinSpeed        # Spin speed (RPM)
```

### Standard Filter Attributes

```
priceTier                       # BUDGET, MID_RANGE, PREMIUM, LUXURY
brand                           # KITCHENTECH, HOMEPRO, etc.
color                           # WHITE, BLACK, SILVER
specifications.energyRating     # B, A, A_PLUS, A_PLUS_PLUS, A_PLUS_PLUS_PLUS
features.wifiEnabled            # Boolean
features.steamCleaning          # Boolean
features.allergenCycle          # Boolean
features.sanitizeCycle          # Boolean
features.energyStarCertified    # Boolean
features.stainlessSteelDrum     # Boolean
features.directDriveMotor       # Boolean
```

---

## Integration Example

### JavaScript/TypeScript

```typescript
async function applySmartFilter(prompt: string) {
  const response = await fetch('/api/smart-filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    // Show error.error and error.suggestion to user
    throw new Error(error.error);
  }

  const filters = await response.json();
  return filters;
}

// Usage
try {
  const filters = await applySmartFilter('small family under $800');
  console.log(filters);
} catch (error) {
  console.error('Filter error:', error.message);
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/smart-filter \
  -H "Content-Type: application/json" \
  -d '{"prompt": "small family under $800"}'
```

---

## Best Practices

### For Users

✅ **Do:**

- Use clear, specific terms: "small family", "energy efficient", "WiFi"
- Mention price explicitly: "under $800", "around $2000"
- Combine terms naturally: "budget friendly small family"

❌ **Don't:**

- Type gibberish or random text
- Use unrelated topics: "pizza", "weather"
- Be too vague: "good", "nice", "best"

### For Developers

✅ **Do:**

- Handle error.suggestion gracefully (show to user)
- Display confidence scores for transparency
- Implement loading states (AI takes 1-3 seconds)
- Log rejected queries for analysis

❌ **Don't:**

- Assume 100% accuracy (AI can make mistakes)
- Skip error handling (network issues happen)
- Ignore low confidence warnings
- Call API for every keystroke (debounce input)

---

## Debugging

### Enable Verbose Logging

The API logs critical events only. Check console for:

```
🔍 Processing query: small family
✅ Filters applied: { range: 1, standard: 0, confidence: 0.9 }
```

Or errors:

```
⚠️ Query rejected: akndkand random
❌ AI failed, using fallback
❌ AI attempt 1 failed: Network timeout
```

### Common Issues

| Issue            | Cause                                 | Solution                                     |
| ---------------- | ------------------------------------- | -------------------------------------------- |
| "No valid terms" | Query has no washing machine keywords | Add keywords like "family", "budget", "WiFi" |
| "Low confidence" | AI uncertain about interpretation     | Rephrase with clearer terms                  |
| All retries fail | HuggingFace API down                  | Rule-based fallback activates                |
| Empty filters    | AI couldn't parse query               | Check if query is too ambiguous              |

---

## Future Improvements

### Planned Enhancements

- [ ] Upgrade to OpenAI GPT-4 or Claude (if POC approved)
- [ ] Add support for more product categories
- [ ] Multi-language support
- [ ] Voice input for mobile users
- [ ] Query history and suggestions
- [ ] A/B testing different prompts
- [ ] Custom confidence thresholds per user

---

## Support

For issues or questions:

- Check `/docs/TESTING.md` for test scenarios
- Check `/docs/ARCHITECTURE.md` for technical details
- Review error messages carefully (they include suggestions)
