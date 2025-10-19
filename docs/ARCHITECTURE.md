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
│  ├── Validation                     │
│  ├── HuggingFace Service Call       │
│  ├── Response Normalization         │
│  └── Fallback Handler               │
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
- API call to `/api/smart-filter`

**FilterPanel (`src/components/FilterPanel.tsx`)**

- Traditional manual filters
- Range sliders (price, capacity, noise, spin)
- Checkboxes (brand, color, features)
- Collapsible sections

**ProductGrid & ProductCard**

- Responsive grid layout (1/2/3 columns)
- Product display with specs and features
- Empty state handling

---

## Backend Layer

### API Route (`src/app/api/smart-filter/route.ts`)

**Request Flow:**

1. Validate user prompt
2. Call HuggingFace service
3. Normalize AI response
4. Return structured filters

**Error Handling:**

- Retry logic (3 attempts)
- Rule-based fallback
- Graceful error responses

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

---

## Data Flow

### Smart Filter Request Flow

```
User Input: "3 people family under $800"
    ↓
SmartFilterInput Component
    ↓
POST /api/smart-filter
    ↓
Validate Prompt
    ↓
Build AI Prompt with Business Rules
    ↓
Call HuggingFace API (Mistral-7B)
    ↓
Parse JSON Response
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
Return Filters
```

---

## Key Design Decisions

### 1. Filter Application Strategy

**Decision:** Replace all filters on smart filter application

**Rationale:**

- Clear user intent
- No confusion from mixing manual + AI filters
- Fresh start each query

### 2. Response Normalization

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

### 3. Fallback System

**Decision:** Three-tier fallback (AI → Retry → Rules)

**Rationale:**

- Always functional, even if AI fails
- User never sees "service unavailable"
- Graceful degradation

### 4. Product Shuffling

**Decision:** Randomize product order on page load

**Rationale:**

- More realistic e-commerce experience
- Proves filters work (not pre-sorted)
- Better demo presentation

### 5. Independent Filter Scrolling

**Decision:** Sticky sidebar with overflow-y-auto

**Rationale:**

- Better UX for long filter lists
- Sidebar stays visible during scroll
- Mobile-friendly collapsible design

---

### AI/Backend

**HuggingFace Inference API**

- Free tier available
- Good models (Mistral-7B)
- Easy integration

**Why Mistral-7B-Instruct?**

- Good JSON output
- Understands context
- Fast inference
- Conversational model

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
2. **Memoization** - Could add useMemo for expensive filters
3. **Debouncing** - Could add for real-time search
4. **Code splitting** - Automatic with Next.js

### Scalability

**Current:**

- 50 products, instant filtering
- Client-side filtering

**Production:**

- Server-side pagination
- Database queries
- Caching layer
- CDN for static assets

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

### API Rate Limiting

- HuggingFace has built-in limits
- Vercel function execution limits
- Could add custom rate limiting

---

## Future Enhancements

### Phase 2 (If Approved)

- Migrate to OpenAI GPT-4 or Claude
- Real product database integration
- User analytics
- A/B testing

### Possible Improvements

- Voice input
- Search history (localStorage)
- Filter presets
- Multi-language support
- Product recommendations
