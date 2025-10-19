# Testing Guide

Comprehensive test scenarios for the Smart Product Filter POC.

---

## Quick Test Scenarios

Copy-paste these queries directly into the smart filter input.

### Basic Queries

```
3 people family under $800
energy efficient
WiFi enabled
quiet
budget friendly
```

### Advanced Queries

```
quiet premium washer
big family energy star certified
energy efficient with WiFi
affordable with steam cleaning
small family compact
```

---

## Detailed Test Cases

### Test Case 1: Family Size + Budget

**Query:** `"3 people family under $800"`

**Expected Filters:**

- Price: max $800
- Capacity: 4.0-4.5 cu ft
- Price Tier: BUDGET

**Expected Results:**

- ~15 products shown
- All under $800
- Capacity between 4.0-4.5 cu ft

**Pass Criteria:**

- ✅ Product count updates correctly
- ✅ All products match filters
- ✅ Confidence score ≥ 0.8

---

### Test Case 2: Energy Efficiency

**Query:** `"energy efficient"`

**Expected Filters:**

- Energy Rating: A++, A+++

**Expected Results:**

- ~13 products shown
- Only A++ or A+++ rated

**Pass Criteria:**

- ✅ No A, A+, or B ratings shown
- ✅ Product count accurate
- ✅ Confidence score = 1.0

---

### Test Case 3: WiFi Feature

**Query:** `"WiFi enabled"`

**Expected Filters:**

- WiFi Enabled: true

**Expected Results:**

- ~24 products shown
- All have WiFi feature

**Pass Criteria:**

- ✅ All products show WiFi tag
- ✅ Non-WiFi products excluded

---

### Test Case 4: Quiet Operation

**Query:** `"quiet"`

**Expected Filters:**

- Noise Level: max 60 dB

**Expected Results:**

- ~20-25 products shown
- Noise level ≤ 60 dB

**Pass Criteria:**

- ✅ All products have noise ≤ 60 dB
- ✅ Products with 61+ dB excluded

---

### Test Case 5: Multi-Criteria

**Query:** `"quiet premium washer"`

**Expected Filters:**

- Noise Level: max 60 dB
- Price Tier: PREMIUM

**Expected Results:**

- ~8-10 products shown
- Premium tier + quiet

**Pass Criteria:**

- ✅ All are premium tier
- ✅ All have noise ≤ 60 dB
- ✅ Correct product count

---

### Test Case 6: Big Family

**Query:** `"big family"`

**Expected Filters:**

- Capacity: min 5.0 cu ft

**Expected Results:**

- ~15 products shown
- Large capacity washers

**Pass Criteria:**

- ✅ All capacity ≥ 5.0 cu ft
- ✅ No small capacity products

---

### Test Case 7: Combined Features

**Query:** `"energy efficient with WiFi"`

**Expected Filters:**

- Energy Rating: A++, A+++
- WiFi Enabled: true

**Expected Results:**

- ~8-12 products shown
- Both features present

**Pass Criteria:**

- ✅ All are A++ or A+++
- ✅ All have WiFi
- ✅ High confidence (≥0.8)

---

### Test Case 8: Budget Friendly

**Query:** `"budget friendly"`

**Expected Filters:**

- Price Tier: BUDGET

**Expected Results:**

- 15 products shown
- All under $1000

**Pass Criteria:**

- ✅ Exactly 15 products
- ✅ All prices < $1000
- ✅ Budget badge visible

---

## Edge Cases

### Empty Query

**Query:** `""` (empty)

**Expected:**

- Error message: "Please enter a search query"
- No filters applied

---

### Very Long Query

**Query:** 500+ characters

**Expected:**

- Character counter shows 500/500
- Input limited to 500 chars
- API rejects if exceeded

---

### Nonsense Query

**Query:** `"xyz abc 123"`

**Expected:**

- Falls back to rule-based parsing
- Returns empty filters or minimal results
- Confidence: 0.5
- Message suggests trying different query

---

### Contradictory Query

**Query:** `"budget luxury washer"`

**Expected:**

- AI picks one (usually first mentioned: BUDGET)
- Or returns both, UI shows no results
- Confidence may be lower

---

## Manual Filter Testing

### Test Manual + AI Interaction

1. Apply smart filter: `"energy efficient"`
2. Manually check additional brand: KITCHENTECH
3. **Expected:** Shows energy efficient KITCHENTECH only

**Pass Criteria:**

- ✅ Filters combine correctly
- ✅ Manual edits persist
- ✅ Clear button resets all

---

### Test Clear Functionality

1. Apply any smart filter
2. Click "Clear" button
3. **Expected:** All filters reset, 50 products shown

---

### Test Mobile Filters

1. Resize to mobile (< 768px)
2. Click "Filters" button
3. **Expected:** Sidebar opens as overlay
4. Apply filter
5. **Expected:** Overlay closes, filters apply

---

## Performance Testing

### Response Time

**Query:** `"3 people family under $800"`

**Expected:**

- AI response: < 2 seconds
- UI update: < 100ms
- Total: < 2.5 seconds

**Slow Response Indicators:**

- First request takes longer (model loading)
- Subsequent requests faster

---

### Multiple Rapid Queries

1. Type query, click Apply
2. Immediately type new query, click Apply
3. Repeat 5 times

**Expected:**

- Loading state shows correctly
- Previous requests cancelled/ignored
- Final result matches last query
- No race conditions

---

## Fallback Testing

### Simulate API Failure

**Setup:**

1. Use invalid HuggingFace API key
2. Or disconnect internet

**Query:** `"energy efficient"`

**Expected:**

- Console shows 3 failed attempts
- Falls back to rule-based parsing
- Still returns filters
- Confidence: 0.5
- Message: "Using rule-based fallback"

---

## Browser Compatibility

Test in:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)
