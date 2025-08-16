# Driver's License Fix - v3.11.12 (Prevents Aggressive Re-filling)

## Update v3.11.12 - Stop Flashing/Re-filling
Fixed the issue where driver's license fields were being filled multiple times causing flashing.

### Changes:
1. **Skip already-filled fields** - Added check to prevent re-filling text fields that already have values
2. **Reduced passes from 3 to 2** - Less aggressive filling prevents the flashing issue
3. **Conditional license field filling** - Only fill license number/state when hasLicense is true

### Code Changes:
- Lines 252-258: Skip fields that already have values
- Line 10: Reduced maxPasses from 3 to 2
- Lines 1167-1178: Only fill license details when hasLicense is true

---

# Driver's License Radio Button Fix - v3.11.11

## Problem
The driver's license question "Do you or did you ever hold a U.S. Driver's License?" was not being answered automatically, even though the data was present in the JSON:
```json
"driverLicense": {
  "hasLicense": true,
  "number": "099264144",
  "state": "CT"
}
```

## Root Cause
The field mapping was correctly generating boolean values for both radio options:
- `rblPREV_US_DRIVER_LIC_IND_0` (Yes option) → `true` when hasLicense is true
- `rblPREV_US_DRIVER_LIC_IND_1` (No option) → `true` when hasLicense is false

However, the radio button handling logic was not properly checking the "No" option when it received `true` as its value.

## Solution
Fixed the radio button handling logic to properly understand that:
1. When a field mapping returns `true`, that specific radio button should be checked
2. When a field mapping returns `false`, that radio button should NOT be checked
3. The field mappings already determine which radio button gets the `true` value

### Code Changes

#### 1. Improved Radio Button Handling (lines 573-585)
```javascript
// Before: Only checked radio buttons for "yes" values
// After: Properly checks any radio button when its mapping returns true
if (value === true || value === 'true' || value === 'yes' || value === 'on') {
  element.checked = true;
  // Trigger events...
}
```

#### 2. Enhanced Driver License Field Mapping (lines 1347-1357)
Added better logging and explicit handling for undefined/null values:
```javascript
'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND_1': (() => {
  const hasLicense = data.previousTravel?.driverLicense?.hasLicense;
  const shouldCheckNo = hasLicense === false || hasLicense === undefined || hasLicense === null;
  console.log('[DRIVER LICENSE RADIO] NO option - hasLicense:', hasLicense, 'Will check:', shouldCheckNo);
  return shouldCheckNo;
})()
```

## Testing
To verify the fix works:
1. Load the DS-160 form and navigate to the Previous U.S. Travel page
2. Click the Auto-Fill button
3. Check the console for debug messages starting with `[DRIVER LICENSE RADIO]`
4. Verify that:
   - If `hasLicense: true` → "Yes" radio button is checked
   - If `hasLicense: false` → "No" radio button is checked
   - The license number and state fields are filled when applicable

## Version Update
Updated extension version from 3.11.10 to 3.11.11 to reflect this fix.