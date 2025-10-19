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
  "prompt": "3 people family under $800"
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

```json
{
  "error": "Prompt is required and must be a non-empty string"
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

## Query Examples

### Example 1: Family Size + Budget

**Request:**

```json
{
  "prompt": "3 people family under $800"
}
```

**Response:**

```json
{
  "rangeFilters": [
    { "attribute": "price", "maxValue": 800 },
    { "attribute": "specifications.capacity", "minValue": 4.0, "maxValue": 4.5 }
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

### Example 4: Quiet + Premium

**Request:**

```json
{
  "prompt": "quiet premium washer"
}
```

**Response:**

```json
{
  "rangeFilters": [
    { "attribute": "specifications.noiseLevel", "maxValue": 60 }
  ],
  "standardFilters": [
    {
      "attribute": "priceTier",
      "operator": "OR",
      "valueType": "SINGLE",
      "values": ["PREMIUM"]
    }
  ],
  "confidence": 0.75
}
```

---

## Status Codes

| Code | Meaning               | Description                                  |
| ---- | --------------------- | -------------------------------------------- |
| 200  | OK                    | Request successful, filters returned         |
| 400  | Bad Request           | Invalid prompt (empty, too long, wrong type) |
| 500  | Internal Server Error | AI processing failed, fallback also failed   |

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

### Validation Errors

```json
{
  "error": "Prompt is too long (max 500 characters)"
}
```

### AI Processing Errors

```json
{
  "error": "Failed to process smart filter request",
  "details": "HuggingFace API error: 503 - Service Unavailable"
}
```

### Fallback Behavior

If HuggingFace API fails after 3 retries, the system automatically falls back to rule-based parsing:

```
HuggingFace Attempt 1 → Fail
HuggingFace Attempt 2 → Fail
HuggingFace Attempt 3 → Fail
Rule-Based Fallback → Success (confidence: 0.5)
```

---

## Attribute Paths

### Range Filter Attributes

```
price                           # Product price
specifications.capacity         # Capacity in cu ft
specifications.noiseLevel       # Noise level in dB
specifications.spinSpeed        # Spin speed in RPM
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
    throw new Error(error.error);
  }

  const filters = await response.json();
  return filters;
}

// Usage
const filters = await applySmartFilter('3 people family under $800');
console.log(filters);
```

### cURL

```bash
curl -X POST http://localhost:3000/api/smart-filter \
  -H "Content-Type: application/json" \
  -d '{"prompt": "3 people family under $800"}'
```

---

## Testing

### Test Endpoint Health

```bash
curl -X POST http://localhost:3000/api/smart-filter \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

### Check Confidence Scores

Enable console logging to see confidence scores:

```
📊 Filter confidence: 0.85
```

Confidence interpretation:

- **0.8-1.0:** High confidence (AI understands well)
- **0.5-0.8:** Medium confidence (AI has some uncertainty)
- **0.5:** Low confidence (Rule-based fallback used)
