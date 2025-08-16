# Social Media Fix - v3.11.14

## Update v3.11.14 - Restored rblAddSocial Field
Fixed the "Do you wish to provide information about your presence on any other websites..." question that wasn't being answered.

### Fix:
- **Restored** the `rblAddSocial` field mapping (lines 1476-1477)
- This field is for the OTHER websites question, not for social media presence
- Defaults to "No" as most users don't need to provide additional website info

---

# Social Media Fix - v3.11.13

## Problem
Social media fields (Facebook, LinkedIn) were not being filled on the Address and Phone page.

## Root Cause
1. **Incorrect field mapping** - The code was looking for a non-existent `rblAddSocial` Yes/No question
2. **Wrong assumption** - There is NO initial Yes/No question for "Do you have social media presence?"
3. **The form structure is**:
   - Social Media dropdown (directly available, no prerequisite)
   - Social Media identifier text field
   - THEN a Yes/No question about "other websites" (which should be No)

## Solution
1. **Removed incorrect field mappings** for `rblAddSocial_0` and `rblAddSocial_1` (lines 1471-1472)
2. **Added debugging** to social media field mappings to track what's being filled
3. **Clarified the structure** - The social media fields are directly fillable without any prerequisite radio button

## Field Structure Clarification
```
Page: Address and Phone / Contact Information
├── Email fields
├── Social Media Section
│   ├── "Do you have social media presence?" (JUST TEXT, NOT A QUESTION)
│   ├── Social Media Provider/Platform (DROPDOWN) 
│   ├── Social Media Identifier (TEXT FIELD)
│   └── Add Another / Remove buttons
└── "Do you wish to provide information about other websites?" (YES/NO RADIO - Usually NO)
```

## Mapping Details
- `FACEBOOK` → `FCBK`
- `LINKEDIN` → `LINK`
- Handles/usernames are filled directly into text fields

## Testing
When you run the extension now, check the console for:
- `[SOCIAL MEDIA] Platform 0: FACEBOOK → mapped to: FCBK`
- `[SOCIAL MEDIA] Handle 0: BRYAN.LEE52438`
- `[SOCIAL MEDIA] Platform 1: LINKEDIN → mapped to: LINK`
- `[SOCIAL MEDIA] Handle 1: JLIBRYAN`

The social media fields should now fill correctly!