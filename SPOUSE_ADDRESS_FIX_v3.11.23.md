# Spouse Address Dropdown Fix - v3.11.23

## Problem
The spouse address type dropdown was selecting "Other (Specify Address)" instead of "Same as U.S. Contact Address" when the JSON contained `"SAME AS US CONTACT"`.

## Root Cause
The `mapSpouseAddressType` function was only checking for:
- `"SAME AS U.S. CONTACT"` (with period after U.S.)

But the actual JSON data contained:
- `"SAME AS US CONTACT"` (without period)

This mismatch caused the function to default to "O" (Other) instead of "S" (Same as U.S. Contact).

## Solution
Updated the `mapSpouseAddressType` function to check for both variations:
1. `"SAME AS U.S. CONTACT"` (with period)
2. `"SAME AS US CONTACT"` (without period)

### Code Changes (content.js, line 3424)
```javascript
// Before:
if (value === 'SAME AS U.S. CONTACT') return 'S';

// After:
if (value === 'SAME AS U.S. CONTACT' || value === 'SAME AS US CONTACT') return 'S';
```

## Field Mapping Values
- `'S'` → "Same as U.S. Contact Address"
- `'H'` → "Same as Home Address" 
- `'O'` → "Other (Specify Address)"

## Testing
When the JSON contains:
```json
"spouseAddress": {
  "type": "SAME AS US CONTACT"
}
```

The dropdown should now correctly select "Same as U.S. Contact Address" instead of "Other (Specify Address)".

## Version Update
Updated extension version from 3.11.22 to 3.11.23 to reflect this fix.