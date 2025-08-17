# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DS-160 Chrome Extension - Automates filling the U.S. Department of State DS-160 visa application form. The extension receives structured data from the TomitaLaw AI backend and fills ~70% of form fields automatically, saving applicants 30-45 minutes per application.

## Essential Commands

### Development & Testing
```bash
# Load extension in Chrome:
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory

# Test with sample data
# Copy any TEST_*.json file content and use in popup.html textarea

# Version bump (after making changes)
# Update version in manifest.json (e.g., 3.11.26 -> 3.11.27)
```

### Deployment
```bash
# Package for Chrome Web Store
# 1. Create ZIP of all files except .git, *.md files
# 2. Upload to Chrome Web Store Developer Dashboard

# For internal testing
# Share the folder directly - users can load as unpacked extension
```

## Architecture

### Core Components

**content.js** (4000+ lines)
- Heart of the extension - contains ALL form filling logic
- Field mappings for 200+ DS-160 fields across 8+ pages
- Helper functions for data transformation (dates, countries, relationships)
- Multi-pass filling system to handle dynamic form elements
- Notification system for user guidance

**background.js**
- Service worker for Chrome Extension Manifest V3
- Handles communication between popup and content script
- Manages cross-origin requests to TomitaLaw backend

**popup.html/js**
- Simple interface for manual data input
- Receives data from TomitaLaw website via `postMessage`
- Stores data in Chrome storage for content script access

### Critical Patterns & Gotchas

#### ASP.NET Field Naming Convention
```javascript
// DS-160 uses ASP.NET WebForms with specific naming patterns:
'ctl00_SiteContentPlaceHolder_FormView1_[fieldname]'

// Dynamic fields use indices:
'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_[fieldname]' // First employer
'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl01_[fieldname]' // Second employer
```

#### Radio Button Pattern
```javascript
// Radio buttons use _0 and _1 suffixes:
'rblField_0': true,  // Yes/First option
'rblField_1': false, // No/Second option
```

#### Date Field Splitting
DS-160 splits dates into separate fields. The extension handles this automatically:
```javascript
// Input: "20-SEP-1991"
getDayFromDate(date)    // Returns: "20"
getMonthNumber(date)    // Returns: "09" 
getYearFromDate(date)   // Returns: "1991"
```

#### Address Length Restrictions
DS-160 crashes with addresses >40 characters. Extension implements smart truncation:
```javascript
truncateAddress(address, 40) // Truncates at word boundary
// Or uses overflow to Address Line 2
```

### Page Detection & Multi-Pass System

The extension uses a 3-pass system to handle dynamic form elements:
1. **Pass 1**: Fill standard fields
2. **Pass 2**: Handle checkboxes and special logic
3. **Pass 3**: Final verification

Page detection happens automatically based on visible form elements.

### Data Flow

1. **TomitaLaw Backend** extracts data from documents using Gemini AI
2. **Backend** sends structured JSON to extension via `postMessage`
3. **Extension** stores data in Chrome storage
4. **Content Script** reads storage and fills form fields
5. **Notifications** guide users through manual steps if needed

## Key Files to Modify

### Adding New Fields
Edit `content.js`:
1. Add field mapping in the main `fieldMapping` object (~line 300-2500)
2. Test with sample JSON data
3. Update `DS160_DATA_FORMAT.md` with new data structure

### Fixing Field Issues
Common fixes in `content.js`:
- Dropdown not filling: Check `mapCountry()`, `mapRelationship()` helper functions
- Checkbox issues: Verify checkbox ID and boolean logic
- Date problems: Check date parsing functions
- Crashes: Look for address length issues or dropdown change events

### Version Updates
1. Update `manifest.json` version number
2. Add entry to `UPDATE_LOG.md`
3. Create fix documentation if significant change

## Testing Approach

### Quick Test
1. Load extension as unpacked
2. Navigate to https://ceac.state.gov/genniv/
3. Use TEST_ACTUAL_DATA_SANITIZED.json
4. Click "Auto-Fill Current Page"
5. Verify fields are populated

### Comprehensive Test
Test each page type:
- Personal Information (Pages 1-2)
- Address and Phone
- Passport/Travel Document
- U.S. Point of Contact
- Work/Education (Present & Previous)
- Security Questions (Parts 1-5)

## Known Issues & Workarounds

### Work/Education Page Dropdowns
Some dropdowns trigger page reloads. Extension skips change events but fills values.

### Multiple Entries
For multiple employers/education entries, extension fills first 5 automatically and shows notification for additional entries.

### Security Questions
All default to "No" unless explicitly marked true in data - safer default for visa applications.

## External Dependencies

- **Chrome Extension Manifest V3** - Service worker architecture
- **TomitaLaw Backend** - Provides structured data
- **ceac.state.gov** - Target website (DS-160 form)

## Important Security Notes

- Extension only works on official state.gov domain
- No data is sent anywhere except official form submission
- All processing happens locally in browser
- Follows U.S. State Department guidelines