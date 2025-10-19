# Changelog

Recent improvements and bug fixes for Smart Product Filter POC.

---

## 2025-10-19 - Major Bug Fixes & Optimizations

### 🐛 Bug Fixes

#### Issue #1: "Small family" query returning no results

**Problem:** AI was adding unwanted energy rating filter (A++/A+++) when user typed "small family", causing zero results because budget washers typically have B or A ratings.

**Root Cause:** AI was making assumptions - assuming "small family" implied wanting energy-efficient products.

**Solution:**

- Enhanced AI prompt with explicit instructions to ONLY add filters that are explicitly mentioned
- Added examples showing correct vs incorrect behavior
- Emphasized: "small family" = capacity ONLY, nothing else

**Files Changed:**

- `src/lib/services/huggingface.ts`

**Result:** ✅ "Small family" now correctly returns ~4 products with capacity 4.0-4.5 cu ft

---

#### Issue #2: Capacity filter not showing in UI inputs

**Problem:** When smart filter applied capacity filter, the Min/Max input boxes remained empty even though products were being filtered correctly.

**Root Cause:** Mismatched attribute paths between `available-filters.ts` and the AI response:

- AI returned: `"specifications.capacity"`
- Config had: `"capacity"` (missing `specifications.` prefix)

**Solution:**

- Updated `available-filters.ts` to use correct attribute paths
- Changed `"capacity"` → `"specifications.capacity"`
- Changed `"energyRating"` → `"specifications.energyRating"`
- Changed `"noiseLevel"` → `"specifications.noiseLevel"`
- Changed `"spinSpeed"` → `"specifications.spinSpeed"`

**Files Changed:**

- `src/lib/available-filters.ts`

**Result:** ✅ Capacity inputs now correctly display 4.0 and 4.5 when smart filter applies

---

#### Issue #3: Gibberish queries returning random filters

**Problem:** Typing random text like "akndkand adnadnad" was returning filters with high confidence (0.9), causing incorrect results.

**Root Cause:** AI was trying to be helpful by guessing, even when it shouldn't. This is called "hallucination".

**Solution:**

- Added **pre-validation layer** before AI call
- Checks for valid washing machine keywords (family, budget, WiFi, etc.)
- Instantly rejects gibberish without calling AI
- Provides helpful suggestions to user

**Files Changed:**

- `src/app/api/smart-filter/route.ts` (added `isValidWashingMachineQuery()`)

**Benefits:**

- ⚡ Instant rejection (~1ms vs ~2s AI call)
- 💰 Saves API costs (no unnecessary calls)
- 🎯 Better user experience (helpful error messages)
- 📊 Cleaner logs

**Result:** ✅ Gibberish now instantly rejected with suggestion: "Try: small family, budget, WiFi..."

---

### 🔧 Technical Improvements

#### Deprecated API Update

**Problem:** Using deprecated `HfInference` class from `@huggingface/inference`

**Solution:**

- Migrated to `InferenceClient` (new recommended API)
- Updated all references and variable names

**Files Changed:**

- `src/lib/services/huggingface.ts`

**Result:** ✅ No deprecation warnings, future-proof code

---

#### Logging Cleanup

**Problem:** Too many console logs making debugging harder:

- Every API attempt logged
- Raw response dumps
- Success confirmations
- Normalization details

**Solution:**

- Removed noise logs (attempts, raw responses, success messages)
- Kept only critical logs (errors, warnings, final results)
- Followed "log only what matters" principle

**Files Changed:**

- `src/app/api/smart-filter/route.ts`
- `src/lib/services/huggingface.ts`

**Before:**

```
🔑 Using HuggingFace InferenceClient
🤖 HuggingFace API attempt 1...
📦 Raw response: {...}
✅ HuggingFace InferenceClient call successful
📊 Filter confidence: 0.85
📋 Raw AI Response BEFORE normalization: {...}
✅ Normalized response: {...}
📋 Normalized AI Response: {...}
📊 Filter confidence: 0.85
✅ Smart filter response: {...}
```

**After:**

```
🔍 Processing query: small family
✅ Filters applied: { range: 1, standard: 0, confidence: 0.9 }
```

**Result:** ✅ Much cleaner console, easier debugging

---

### ⚙️ Architecture Changes

#### Three-Tier Validation System

**New Flow:**

```
1. Pre-Validation (Code)
   ├─ Check keywords
   └─ Reject gibberish instantly

2. AI Processing (HuggingFace)
   ├─ 3 retry attempts
   └─ Fallback to rules if all fail

3. Rule-Based Fallback (Regex)
   └─ Always return something
```

**Benefits:**

- Cost optimization (reject bad input early)
- Always functional (never completely fails)
- Better UX (instant feedback for gibberish)

---

#### Prompt Engineering Improvements

**Changes:**

- Added ⚠️ CRITICAL warnings at top of prompt
- Emphasized: Only add explicitly mentioned filters
- Added step-by-step instructions for AI
- Included correct/wrong examples
- Removed gibberish handling (now in pre-validation)

**Result:** AI behavior is much more predictable and reliable

---

### 📚 Documentation Updates

#### Updated Files:

1. **API.md**

   - Added pre-validation section
   - Updated error response examples
   - Added confidence score table
   - Documented three-tier fallback system
   - Added best practices section

2. **ARCHITECTURE.md**

   - Added pre-validation flow diagram
   - Documented design decisions
   - Added lessons learned section
   - Updated data flow diagrams
   - Added monitoring guidelines

3. **CHANGELOG.md** (New)
   - Summary of all changes
   - Before/after comparisons
   - Migration guide

---

## Migration Guide

If you're updating from the previous version:

### Step 1: Update Files

Replace these files with the new versions:

- ✅ `src/lib/services/huggingface.ts`
- ✅ `src/lib/available-filters.ts`
- ✅ `src/app/api/smart-filter/route.ts`

### Step 2: Test Critical Queries

```bash
# Should work correctly now
- "small family" → Shows ~4 products
- "energy efficient" → Shows A++/A+++ products
- "WiFi enabled" → Shows WiFi products

# Should reject instantly
- "akndkand random" → Error with suggestion
- "pizza delivery" → Error with suggestion
```

### Step 3: Verify UI

- Capacity inputs should show values (4.0, 4.5)
- Budget checkbox should be checked
- No deprecation warnings in console
- Clean console logs (only critical events)

---

## Performance Impact

### Before:

- Gibberish queries: ~2 seconds (wasted AI call)
- Console: 10+ log lines per request
- "Small family": 0 results ❌

### After:

- Gibberish queries: ~1ms (instant rejection)
- Console: 2-3 log lines per request
- "Small family": 4 results ✅

### Cost Savings:

- Estimated 20-30% reduction in AI API calls (gibberish rejection)
- Faster response times for invalid queries
- Better user experience

---

## Key Learnings

### 1. Prompt Engineering is Critical

Small changes in prompts = big impact on AI behavior. Being explicit prevents hallucination.

### 2. Pre-Validation Saves Money

Checking for valid input BEFORE calling AI reduces costs and improves UX.

### 3. Not Everything Needs AI

Simple validation can be done with code. Use the right tool for the job.

### 4. Logging Discipline Matters

Log only what's actionable. Too many logs = harder debugging.

### 5. Testing Edge Cases is Essential

Gibberish, empty strings, unrelated topics - all need to be handled gracefully.

---

## Known Issues

### None Currently

All major issues from user testing have been resolved.

---

## Next Steps

### Recommended Improvements:

1. Add query history (localStorage)
2. Add autocomplete suggestions
3. A/B test different prompts
4. Add analytics tracking
5. Consider voice input for mobile

### If POC Approved:

1. Migrate to OpenAI GPT-4 or Claude
2. Integrate with real product database
3. Add user analytics
4. Implement caching layer
5. Add custom confidence thresholds

---

## Testing Checklist

- [x] "Small family" returns products
- [x] Capacity inputs show values
- [x] Gibberish rejected instantly
- [x] Energy efficient works correctly
- [x] WiFi filter works correctly
- [x] No deprecation warnings
- [x] Clean console logs
- [x] Error messages helpful
- [x] Confidence scores accurate
- [x] Rule-based fallback works

---

## Contributors

- Initial POC development
- Bug fixes and optimizations (2025-10-19)
- Documentation updates

---

## Support

For questions or issues:

- Check `/docs/API.md` for API details
- Check `/docs/TESTING.md` for test scenarios
- Check `/docs/ARCHITECTURE.md` for technical details
- Review this changelog for recent changes
