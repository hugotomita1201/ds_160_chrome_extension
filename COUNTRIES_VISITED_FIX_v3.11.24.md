# Countries Visited Fix - v3.11.24

## Problem
The extension was only filling the first 3 countries visited in the last 5 years, even when the JSON data contained 5 countries. The 4th and 5th dropdown fields were left empty, requiring manual selection.

## Root Cause
The field mappings in the content.js file only included entries for the first 3 country dropdowns:
- `ctl00_ddlCOUNTRIES_VISITED` (1st country)
- `ctl01_ddlCOUNTRIES_VISITED` (2nd country)
- `ctl02_ddlCOUNTRIES_VISITED` (3rd country)

The mappings for the 4th and 5th countries were missing:
- `ctl03_ddlCOUNTRIES_VISITED` (4th country)
- `ctl04_ddlCOUNTRIES_VISITED` (5th country)

## Solution
Added field mappings for the 4th and 5th countries visited:

### Code Changes (content.js, lines 2305-2308)
```javascript
// Added new mappings
'ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl03_ddlCOUNTRIES_VISITED': 
  this.mapCountry(data.workEducation?.countriesVisited5Years?.[3]),
'ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl04_ddlCOUNTRIES_VISITED': 
  this.mapCountry(data.workEducation?.countriesVisited5Years?.[4]),
```

### Notification Update (line 5163)
Updated the helper notification message from:
- "The extension will fill the first 3 countries..."

To:
- "The extension will fill up to 5 countries. If you have more than 5 countries, click 'Add Another' button..."

## Testing
When the JSON contains 5 countries like:
```json
"countriesVisited5Years": [
  "UNITED STATES OF AMERICA",
  "CHINA",
  "MEXICO",
  "CANADA",
  "JAPAN"
]
```

All 5 dropdown fields should now be automatically filled with the corresponding country values.

## Limitations
- The extension can now fill up to 5 countries automatically
- If a user has visited more than 5 countries, they'll need to manually click "Add Another" and select additional countries
- This is a reasonable limit as most users don't visit more than 5 countries in 5 years

## Version Update
Updated extension version from 3.11.23 to 3.11.24 to reflect this enhancement.