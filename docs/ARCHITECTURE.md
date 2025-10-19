# Architecture Overview

Technical architecture and design decisions for the Smart Product Filter POC.

---

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (Next.js + React)         │
│  ├── SmartFilterInput               │
│  ├── FilterPanel                    │
│  └── ProductGrid                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API Route (/api/smart-filter)      │
│  ├── Pre-Validation (NEW)           │
│  ├── HuggingFace Service Call       │
│  ├── Response Normalization         │
│  └── Rule-Based Fallback            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  HuggingFace Inference API          │
│  (Mistral-7B-Instruct-v0.3)         │
└─────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Layer

**Main Page (`src/app/page.tsx`)**

- State management for filters and products
- Product shuffling for realistic display
- Filter application logic

**SmartFilterInput (`src/components/SmartFilterInput.tsx`)**

- Natural language input textarea
- Quick hint chips
- Loading states and error handling
- Displays error messages with suggestions
- API call to `/api/smart-filter`

**FilterPanel (`src/components/FilterPanel.tsx`)**

- Traditional manual filters
- Range sliders (price, capacity, noise, spin)
- Checkboxes (brand, color, features)
- Collapsible sections
- Syncs with smart filter selections

**ProductGrid & ProductCard**

- Responsive grid layout (1/2/3 columns)
- Product display with specs and features
- Empty state handling

---

## Backend Layer

### API Route (`src/app/api/smart-filter/route.ts`)

**Request Flow:**

```
1. Validate prompt (empty, length)
2. Pre-validate keywords (NEW)
   ├─ Check for washing machine terms
   └─ Reject gibberish instantly
3. Call HuggingFace service (if valid)
4. Check confidence score
5. Normalize AI response
6. Return structured filters
```

**Error Handling:**

- Pre-validation rejection (no AI call)
- Retry logic (3 attempts)
- Rule-based fallback
- Graceful error responses with suggestions

### Pre-Validation Layer (NEW)

**Function:** `isValidWashingMachineQuery()`

**Purpose:**

- Prevent unnecessary AI calls for gibberish
- Save API costs
- Provide instant feedback

**Logic:**

```typescript
Valid if:
  - Contains washing machine keywords (family, budget, WiFi, etc.)
  OR
  - Contains numbers AND query < 50 chars (e.g., "under 800")
```

**Benefits:**

- ⚡ Instant rejection (~1ms vs ~2s AI call)
- 💰 Saves HuggingFace API credits
- 🎯 Predictable behavior
- 📊 Reduces error logs from AI

### HuggingFace Service (`src/lib/services/huggingface.ts`)

**Responsibilities:**

- Build AI prompt with business rules
- Call HuggingFace chat completion API
- Extract JSON from response
- Handle retries with exponential backoff

**Prompt Engineering:**

- Include all available filters
- Provide business rule mappings
- Specify exact attribute paths
- Define output format
- **Emphasize:** Only add explicitly mentioned filters

**Key Improvements:**

- Uses `InferenceClient` (not deprecated `HfInference`)
- Minimal logging (only errors)
- Clear examples of correct/wrong behavior

---

## Data Flow

### Smart Filter Request Flow

```
User Input: "small family under $800"
    ↓
SmartFilterInput Component
    ↓
POST /api/smart-filter
    ↓
Validate Prompt (empty, length)
    ↓
Pre-Validate Keywords ⭐ NEW
  ├─ Has "family" ✅
  ├─ Has "$800" ✅
  └─ Valid → Continue
    ↓
Build AI Prompt with Business Rules
    ↓
Call HuggingFace API (Mistral-7B)
  ├─ Attempt 1
  ├─ Attempt 2 (if fail)
  └─ Attempt 3 (if fail)
    ↓
Parse JSON Response
    ↓
Check Confidence Score
  ├─ < 0.3 → Reject
  └─ ≥ 0.3 → Continue
    ↓
Normalize Response
  ├── Fix attribute paths
  ├── Move misplaced filters
  └── Validate structure
    ↓
Return SmartFilterResponse
    ↓
Convert to AppliedFilters
    ↓
Filter Products
    ↓
Update UI
```

### Pre-Validation Flow (NEW)

```
User Input: "akndkand random text"
    ↓
POST /api/smart-filter
    ↓
Validate Prompt
    ↓
Pre-Validate Keywords ⭐
  ├─ Check keyword list
  ├─ No matches ❌
  └─ Reject immediately
    ↓
Return 400 Error
  ├─ "No washing machine terms found"
  └─ Suggestion: "Try: small family, budget..."
    ↓
Show Error in UI
    ↓
No AI call made ⚡ (saves ~2 seconds + API cost)
```

### Fallback Flow

```
HuggingFace API Call
    ↓
  Fails
    ↓
Retry (Attempt 2)
    ↓
  Fails
    ↓
Retry (Attempt 3)
    ↓
  Fails
    ↓
Rule-Based Fallback
  ├── Regex patterns
  ├── Price extraction
  ├── Feature keywords
  └── Capacity mapping
    ↓
Return Filters (confidence: 0.5)
```

---

## Key Design Decisions

### 1. Pre-Validation Before AI (NEW)

**Decision:** Add keyword validation before calling AI

**Rationale:**

- AI was hallucinating filters for gibberish
- Wasting API calls and credits
- Poor user experience (incorrect results)
- Pre-validation is instant and free

**Implementation:**

```typescript
if (!isValidWashingMachineQuery(prompt)) {
  return error; // No AI call
}
```

### 2. Filter Application Strategy

**Decision:** Replace all filters on smart filter application

**Rationale:**

- Clear user intent
- No confusion from mixing manual + AI filters
- Fresh start each query

### 3. Response Normalization

**Decision:** Auto-correct AI mistakes in API route

**Rationale:**

- AI sometimes uses wrong attribute paths
- Moves misplaced filters automatically
- Improves reliability without retraining

**Example:**

```typescript
// AI returns: "energyRating"
// System corrects to: "specifications.energyRating"
```

### 4. Three-Tier Fallback System

**Decision:** Pre-validation → AI (3 retries) → Rules

**Rationale:**

- Always functional, even if AI fails
- User never sees "service unavailable"
- Graceful degradation
- Cost optimization (reject gibberish early)

### 5. Strict Prompt Engineering

**Decision:** Tell AI to ONLY add explicitly mentioned filters

**Rationale:**

- AI was adding assumptions (e.g., "small family" → energy efficient)
- Caused "no products found" errors
- Explicit instructions fix this behavior

**Example:**

```
Query: "small family"
Correct: Only capacity filter
Wrong: Adding energy rating (not mentioned) ❌
```

### 6. Product Shuffling

**Decision:** Randomize product order on page load

**Rationale:**

- More realistic e-commerce experience
- Proves filters work (not pre-sorted)
- Better demo presentation

### 7. Minimal Logging

**Decision:** Log only critical events

**Rationale:**

- Cleaner console output
- Easier debugging
- Better performance
- Focus on actionable information

**Kept:**

- ✅ Query rejected
- ✅ Processing query
- ✅ Filters applied
- ❌ AI failures

**Removed:**

- ❌ AI attempt logs
- ❌ Raw response dumps
- ❌ Success confirmations
- ❌ Detailed normalization steps

---

## Tech Stack

### Frontend

**Next.js 15**

- App Router
- Server Components
- Client Components for interactivity

**React 19**

- Hooks (useState, useEffect)
- Component composition

**Tailwind CSS 4**

- Utility-first styling
- Responsive design
- No custom CSS needed

### AI/Backend

**HuggingFace Inference API**

- Free tier available
- Mistral-7B-Instruct model
- InferenceClient (not deprecated)

**Why Mistral-7B-Instruct?**

- Good JSON output
- Understands context
- Fast inference (~1-2s)
- Conversational model
- Free tier sufficient for POC

### Deployment

**Vercel**

- Seamless Next.js integration
- Free tier
- Automatic deployments
- Easy environment variables

---

## State Management

### Local State (useState)

```typescript
// Products
const [allProducts] = useState<Product[]>(shuffled);
const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

// Filters (Map-based for efficiency)
const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
  rangeFilters: new Map(),
  standardFilters: new Map(),
});
```

**Why Maps?**

- O(1) lookup
- Easy to add/remove
- Natural key-value structure

### Effect Hooks

```typescript
// Re-filter when appliedFilters changes
useEffect(() => {
  const filtered = applyFilters(allProducts, appliedFilters);
  setFilteredProducts(filtered);
}, [appliedFilters, allProducts]);
```

---

## Filter Application Logic

### Range Filters

```typescript
// Check if product value is within min/max
if (range.min && value < range.min) return false;
if (range.max && value > range.max) return false;
```

### Standard Filters

```typescript
// For boolean features
if (values.has('true') && !productValue) return false;

// For string values (brand, color, etc.)
if (!values.has(productValue)) return false;
```

### Nested Attributes

```typescript
// Support dot notation
getNestedValue(product, 'specifications.energyRating');
// Returns: product.specifications.energyRating
```

---

## Performance Considerations

### Optimizations

1. **Product shuffling once** - useState initializer
2. **Pre-validation** - No AI call for gibberish (saves ~2s)
3. **Minimal logging** - Reduced console overhead
4. **Client-side filtering** - Instant results (50 products)
5. **Code splitting** - Automatic with Next.js

### Scalability

**Current:**

- 50 products, instant filtering
- Client-side filtering
- ~1000 AI requests/day (free tier)

**Production:**

- Server-side pagination
- Database queries
- Caching layer (Redis)
- CDN for static assets
- Paid AI tier (OpenAI/Claude)

---

## Security

### Environment Variables

- API keys in `.env.local` (gitignored)
- Server-side only (API routes)
- Never exposed to client

### Input Validation

- Prompt length limit (500 chars)
- Required field checks
- Type safety with TypeScript
- Pre-validation prevents injection

### API Rate Limiting

- HuggingFace has built-in limits
- Vercel function execution limits
- Pre-validation reduces load

---

## Error Recovery

### Error Handling Strategy

```
Level 1: Pre-Validation (Code)
├─ Invalid keywords → Instant error
└─ Cost: 0, Time: ~1ms

Level 2: AI Processing (HuggingFace)
├─ Attempt 1 → Fail
├─ Attempt 2 → Fail (after 1s wait)
├─ Attempt 3 → Fail (after 2s wait)
└─ Cost: 3 requests, Time: ~6s

Level 3: Rule-Based Fallback (Regex)
├─ Pattern matching
└─ Cost: 0, Time: ~1ms
```

### User Experience

**Gibberish Input:**

- Pre-validation catches → Instant feedback
- No loading spinner → No wasted time
- Helpful suggestions → Guide user

**AI Failure:**

- Rule-based fallback → Always get results
- Lower confidence shown → Transparency
- User can refine query → Retry mechanism

---

## Future Enhancements

### Phase 2 (If Approved)

- Migrate to OpenAI GPT-4 or Claude (better accuracy)
- Real product database integration
- User analytics (track popular queries)
- A/B testing (compare prompts)

### Possible Improvements

- Voice input (mobile users)
- Search history (localStorage)
- Filter presets (save combinations)
- Multi-language support
- Product recommendations
- Autocomplete suggestions
- Query refinement UI

---

## Lessons Learned

### Key Insights

1. **Prompt engineering is critical** - Small changes = big impact
2. **Pre-validation saves costs** - Catch bad input early
3. **AI needs constraints** - "Only explicit filters" prevents hallucination
4. **Fallbacks are essential** - Never rely solely on AI
5. **Logging discipline matters** - Log only what's actionable

### AI Engineering Principles

✅ **Do:**

- Validate input before AI calls
- Provide clear examples in prompts
- Add multiple fallback layers
- Test edge cases extensively
- Monitor confidence scores

❌ **Don't:**

- Assume AI is perfect
- Let AI make assumptions
- Skip error handling
- Over-log successful operations
- Forget about costs

---

## Monitoring & Debugging

### Key Metrics to Track

**Performance:**

- API response time
- Pre-validation rejection rate
- AI vs fallback usage ratio
- Average confidence scores

**Quality:**

- "No products found" rate
- Low confidence warnings
- User query patterns
- Error types frequency

**Cost:**

- HuggingFace API calls/day
- Pre-validation savings
- Fallback activation rate

### Debug Checklist

```
Issue: No products shown
├─ Check console logs
├─ Verify filters applied correctly
├─ Test with simple query first
└─ Check confidence score

Issue: Wrong filters applied
├─ Check AI prompt
├─ Verify attribute paths match
├─ Test normalization logic
└─ Check business rules

Issue: Slow response
├─ Check HuggingFace API status
├─ Verify retry logic
├─ Test pre-validation
└─ Check network

Issue: Gibberish accepted
├─ Verify pre-validation function
├─ Check keyword list
├─ Test validation logic
└─ Update keywords if needed
```

---

## Documentation

- [API Reference](API.md) - Complete API documentation
- [Testing Guide](TESTING.md) - Test scenarios and queries
- [Deployment Guide](DEPLOYMENT.md) - Deploy to Vercel
- [README](../README.md) - Quick start guide
