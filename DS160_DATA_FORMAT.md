# DS-160 Chrome Extension Data Format Specification
**Updated: 2025-08-08**

## Important Changes Based on Actual Form Analysis

### ⚠️ Critical Field Updates
1. **Gender**: Now uses dropdown (`ddlAPP_GENDER`) instead of radio buttons
2. **Birth Location**: All birth fields are on Personal Page 1, NOT Page 2
3. **Marital Status**: Was missing from original mappings - now included
4. **Telecode Fields**: Conditional fields for Chinese names now mapped
5. **"Does Not Apply" Checkboxes**: Multiple N/A checkboxes now supported

## Data Structure for Extension

### Personal Information Object
```javascript
const ds160Data = {
  personal: {
    // === PERSONAL PAGE 1 FIELDS ===
    
    // Basic Information
    surname: "DOE",                      // Required
    givenName: "JOHN",                   // Required
    fullNameNative: "约翰·多伊",          // Use "N/A" if not applicable
    
    // Demographics (UPDATED)
    gender: "M",                         // "M" or "F" - Now maps to dropdown!
    maritalStatus: "SINGLE",             // NEW FIELD! Options: SINGLE, MARRIED, DIVORCED, WIDOWED, etc.
    dateOfBirth: "20-SEP-1991",         // Format: DD-MON-YYYY
    
    // Birth Location (MOVED TO PAGE 1!)
    birthCity: "NEW YORK",               // Required
    birthState: "NEW YORK",              // Use "N/A" if not applicable
    birthCountry: "USA",                 // Will be mapped to country code
    
    // Other Names Section
    otherNames: ["SMITH", "JOHNSON"],   // Array of other surnames used
    
    // Telecode Section (for Chinese names)
    hasTelecode: true,                   // Set to true if Chinese name
    telecodeSurname: "1234",            // Only if hasTelecode is true
    telecodeGivenName: "5678",          // Only if hasTelecode is true
    
    // === PERSONAL PAGE 2 FIELDS ===
    
    // Nationality
    nationality: "CHIN",                 // Country code (not full name)
    otherNationalities: ["JPN", "CAN"],  // Array of other nationality codes
    otherNationalityPassports: [true, false], // Has passport for each other nationality
    otherPassportNumbers: ["EP1234567", ""], // Passport numbers for other nationalities
    permanentResident: false,           // true/false
    permanentResidentCountry: "CAN",    // Country code if permanent resident
    
    // Identification Numbers
    nationalId: "123456789012345",      // Use "N/A" if not applicable
    usSocialSecurity: "699-52-8463",    // Format: XXX-XX-XXXX or "N/A"
    usTaxId: "12-3456789",              // Format: XX-XXXXXXX or "N/A"
  },
  
  travel: {
    // Purpose and Basic Info
    purposeOfTrip: "BUSINESS/TOURISM",  // B, F, H, etc.
    otherPurposeDetail: "Conference",   // When purpose is OTHER
    purposeSpecify: "Tech conference",  // Additional details
    tripPayer: "SELF",                  // SELF, OTHER_PERSON, EMPLOYER, etc.
    specificTravelPlans: true,          // Have specific dates/plans
    
    // Principal Applicant (for dependents)
    principalApplicant: {
      surname: "DOE",
      givenName: "JANE",
      petitionNumber: "WAC1234567890"
    },
    
    // Travel Dates
    intendedTravelDate: "15-MAR-2025",  // When planning to travel
    intendedArrivalDate: "15-MAR-2025", // Arrival in US
    intendedDepartureDate: "30-MAR-2025", // Departure from US
    lengthOfStayNumber: "15",           // Number
    lengthOfStayUnit: "DAYS",           // DAYS, WEEKS, MONTHS
    
    // Flight Information
    arrivalFlightNumber: "UA890",
    arrivalCity: "SAN FRANCISCO",
    departureFlightNumber: "UA891",
    departureCity: "SAN FRANCISCO",
    
    // US Address/Hotel
    usContactName: "HILTON HOTEL",      // Hotel or person's name
    usStreetAddress: "333 O'FARRELL ST",
    usStreetAddress2: "",
    usCity: "SAN FRANCISCO",
    usState: "CA",
    usZipCode: "94102",
    
    // Payer Information (if not self)
    payerInfo: {
      surname: "SMITH",
      givenName: "ROBERT",
      phone: "4155551234",
      email: "robert@company.com",
      relationship: "EMPLOYER",
      sameAddress: false,              // Same address as applicant
      address1: "456 MARKET ST",
      address2: "SUITE 200",
      city: "SAN FRANCISCO",
      state: "CA",
      zipCode: "94105",
      country: "USA"
    },
    
    // Company Information (if company paying)
    companyInfo: {
      name: "TECH CORP INC",
      relationship: "EMPLOYER",
      address1: "456 MARKET ST",
      address2: "SUITE 200",
      city: "SAN FRANCISCO",
      state: "CA",
      zipCode: "94105",
      country: "USA",
      phone: "4155559999"
    },
    
    // Mission/Organization (for religious/official visas)
    missionOrg: {
      name: "FIRST BAPTIST CHURCH",
      contactSurname: "JOHNSON",
      contactGivenName: "MARY",
      address1: "123 CHURCH ST",
      address2: "",
      city: "DALLAS",
      state: "TX",
      zipCode: "75201",
      phone: "2145551234"
    }
  },
  
  previousTravel: {
    // Core Questions
    hasBeenToUS: true,                  // Been to US before
    visaRefused: false,                 // Ever had visa refused
    appliedForPermanentResident: false, // Applied for green card
    immigrantPetition: false,           // Had immigrant petition filed
    
    // Previous US Visits (array - up to 5)
    visits: [
      {
        arrivalDate: "10-JAN-2020",
        lengthOfStayNumber: "7",
        lengthOfStayUnit: "DAYS"        // DAYS, WEEKS, MONTHS
      },
      {
        arrivalDate: "15-MAR-2018",
        lengthOfStayNumber: "2",
        lengthOfStayUnit: "WEEKS"
      }
    ],
    
    // US Driver's License
    driverLicense: {
      hasLicense: true,
      number: "D1234567",                // Or "N/A"
      state: "CA"                        // Two-letter state code
    },
    
    // Previous Visa Information
    previousVisa: {
      hasVisa: true,
      issueDate: "05-JAN-2018",
      visaNumber: "12345678901234",      // Red foil number, use "N/A" or "Do Not Know" if unknown
      sameType: true,                    // Applying for same visa type
      sameCountry: true,                 // Applying at same country
      tenPrinted: true,                  // Had fingerprints taken
      lost: false,                       // Visa was lost
      cancelled: false,                  // Visa was cancelled
      lostYear: "",                      // Year visa was lost (if applicable)
      lostExplanation: "",               // How visa was lost
      cancelledExplanation: ""           // Why visa was cancelled
    },
    
    // Explanation Fields
    visaRefusedExplanation: "",          // If visa was refused
    permanentResidentExplanation: "",    // If applied for green card
    immigrantPetitionExplanation: ""     // If petition was filed
  },
  
  passport: {
    // === PASSPORT INFORMATION PAGE ===
    
    // Passport Type and Number
    type: "REGULAR",                     // REGULAR/R, DIPLOMATIC/D, OFFICIAL/O, SERVICE/S, OTHER/OT
    number: "EP1234567",                 // Passport number
    passportNumber: "EP1234567",         // Alternative field name
    bookNumber: "123456789",             // Book number or "N/A"
    passportBookNumber: "123456789",     // Alternative field name
    
    // Issuance Information
    issuingAuthority: "USA",             // Issuing country/authority
    issueCountry: "USA",                 // Country where issued
    countryOfIssuance: "USA",           // Alternative field name
    issueCity: "WASHINGTON",             // City where issued
    issueState: "DC",                    // State/Province where issued
    
    // Dates
    issueDate: "15-JAN-2020",           // Format: DD-MON-YYYY
    expirationDate: "14-JAN-2030",      // Format: DD-MON-YYYY or "N/A"
    noExpiration: false,                 // true if passport doesn't expire
    
    // Lost/Stolen Passport
    lostPassport: {
      hasLost: false,                   // true/false
      number: "EP9876543",               // Lost passport number or "N/A"
      country: "USA",                    // Country of lost passport
      explanation: "Stolen from hotel"   // How passport was lost
    },
    
    // Other
    otherTypeExplanation: ""            // Explanation for OTHER passport type
  },
  
  contact: {
    // === ADDRESS AND PHONE PAGE ===
    
    // Home Address (REQUIRED)
    homeStreet: "123 MAIN ST",           // Street address line 1
    homeStreet2: "APT 5B",                // Street address line 2 (optional)
    homeCity: "SAN FRANCISCO",           // City
    homeState: "CALIFORNIA",             // State/Province or "N/A"
    homePostalCode: "94102",             // ZIP/Postal code or "N/A"
    homeCountry: "USA",                  // Country code
    
    // Mailing Address
    mailingSameAsHome: true,             // true/false or "YES"/"NO"
    mailingStreet: "456 OAK AVE",        // Only if different from home
    mailingAddress: {                    // Alternative structure
      street: "456 OAK AVE",
      apt: "SUITE 200",
      city: "LOS ANGELES",
      state: "CALIFORNIA",
      postalCode: "90001",
      country: "USA"
    },
    
    // Phone Numbers
    primaryPhone: "4155551234",          // Primary phone (no formatting)
    homePhone: "4155551234",              // Alternative field name
    secondaryPhone: "4155555678",        // Secondary/mobile phone or "N/A"
    workPhone: "4155559999",              // Work phone or "N/A"
    
    // Additional Phone Numbers
    hasOtherPhones: "NO",                // "YES"/"NO"
    otherPhones: [                       // Array of additional phones
      "4155552222",
      "4155553333"
    ],
    
    // Email
    email: "john.doe@email.com",         // Primary email address
    emailAddress: "john.doe@email.com",  // Alternative field name
    
    // Additional Email Addresses
    hasOtherEmails: "NO",                // "YES"/"NO"
    otherEmails: [                       // Array of additional emails
      "johndoe2@email.com",
      "jdoe@work.com"
    ]
  },
  
  usPointOfContact: {
    // === U.S. POINT OF CONTACT PAGE ===
    
    // Contact Person
    contactName: "John Smith",           // Full name (will be split)
    contactSurname: "Smith",             // Alternative: surname only
    contactGivenName: "John",            // Alternative: given name only
    
    // Organization
    contactOrganization: "Tech Corp",    // Organization name
    organization: "Tech Corp",           // Alternative field name
    
    // Relationship
    contactRelationship: "FRIEND",       // FRIEND/F, RELATIVE/R, BUSINESS/B, SCHOOL/S, EMPLOYER/E, HOTEL/H, OTHER/O
    relationship: "FRIEND",              // Alternative field name
    
    // Contact Address
    contactAddress1: "123 Main St",      // Street address line 1
    contactAddress2: "Apt 5B",           // Street address line 2
    contactCity: "San Francisco",        // City
    contactState: "CA",                  // State (2-letter code)
    contactZipCode: "94102",            // ZIP code
    
    // Alternative address structure
    address: {
      street1: "123 Main St",
      street2: "Apt 5B",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102"
    },
    
    // Contact Information
    contactPhone: "4155551234",          // Phone number (digits only)
    phone: "4155551234",                 // Alternative field name
    contactEmail: "john@example.com",    // Email address or "N/A"
    email: "john@example.com"            // Alternative field name
  },
  
  workEducation: {
    // === PRESENT WORK/EDUCATION/TRAINING PAGE ===
    
    // Primary Occupation
    primaryOccupation: "EMPLOYED",       // STUDENT, EMPLOYED, BUSINESS, COMPUTER_SCIENCE, EDUCATION,
                                         // ENGINEERING, GOVERNMENT, HOMEMAKER, MEDICAL, MILITARY,
                                         // NATURAL_SCIENCES, NOT_EMPLOYED, RETIRED, AGRICULTURE,
                                         // ARTIST, COMMUNICATIONS, FINANCE, LEGAL, RESEARCH,
                                         // RELIGIOUS, SOCIAL_SCIENCES, OTHER
    
    // Present Employer/School (nested structure)
    presentEmployer: {
      name: "Tech Corp Inc",             // Employer or school name
      address: {
        street1: "456 Market St",        // Address line 1
        street2: "Suite 200",            // Address line 2
        city: "San Francisco",           // City
        state: "CA",                     // State/Province or "N/A"
        postalCode: "94105",            // Postal/ZIP code or "N/A"
        country: "USA"                   // Country
      },
      phone: "4155559999",               // Phone number
      startDate: "01-JAN-2020",         // Employment/enrollment start date
      monthlyIncome: "5000",            // Monthly salary/income or "N/A"
      jobTitle: "Software Engineer",     // Job title
      duties: "Develop web applications" // Description of duties
    },
    
    // Alternative flat structure
    employerName: "Tech Corp Inc",
    employerAddress: "456 Market St",
    employerPhone: "4155559999",
    employmentStartDate: "01-JAN-2020",
    monthlyIncome: "5000",
    jobDuties: "Develop web applications",
    
    // For students
    highestEducationLevel: "UNIVERSITY", // HIGH_SCHOOL, UNIVERSITY, GRADUATE, DOCTORATE, VOCATIONAL, OTHER
    highestSchoolName: "Stanford University",
    
    // === PREVIOUS WORK/EDUCATION PAGE ===
    // Previous Employers (array of up to 5)
    previousEmployers: [
      {
        employerName: "Previous Corp",
        employerStreetAddress1: "789 Oak St",
        employerStreetAddress2: "Floor 3",
        employerCity: "Los Angeles",
        employerState: "CA",              // or set employerStateNA: true
        employerPostalCode: "90001",      // or set employerPostalCodeNA: true
        employerCountry: "USA",
        employerPhone: "2135551234",
        jobTitle: "Senior Developer",
        supervisorSurname: "Johnson",     // or set supervisorSurnameNA: true
        supervisorGivenName: "Mary",      // or set supervisorGivenNameNA: true
        empDateFromDay: "15",
        empDateFromMonth: "03",
        empDateFromYear: "2018",
        empDateToDay: "31",
        empDateToMonth: "12",
        empDateToYear: "2019",
        describeDuties: "Led development team"
      }
    ],
    
    // Previous Education (array of up to 5)
    previousEducation: [
      {
        schoolName: "UC Berkeley",
        schoolAddr1: "110 Sproul Hall",
        schoolAddr2: "",
        schoolCity: "Berkeley",
        educInstAddrState: "CA",         // or set educInstAddrStateNA: true
        educInstPostalCode: "94720",     // or set educInstPostalCodeNA: true
        schoolCountry: "USA",
        schoolCourseOfStudy: "Computer Science",
        schoolFromDay: "01",
        schoolFromMonth: "09",
        schoolFromYear: "2014",
        schoolToDay: "15",
        schoolToMonth: "06",
        schoolToYear: "2018"
      }
    ],
    
    // === ADDITIONAL WORK/EDUCATION PAGE ===
    // Languages Spoken
    languages: ["English", "Spanish", "Mandarin"],
    
    // Countries Visited in Last 5 Years
    countriesVisited5Years: ["CANADA", "MEXICO", "JAPAN", "CHINA"],
    
    // Clan/Tribe Membership
    clanTribeMembership: "NO",           // YES/NO
    clanTribeName: "",                   // If YES, provide name
    
    // Organization Membership
    organizationMembership: "NO",        // YES/NO
    organizations: [],                   // Array of organization names
    
    // Military Service
    hasMilitaryService: "NO",            // YES/NO
    militaryService: [
      {
        country: "USA",
        branch: "Army",
        rank: "Sergeant",
        specialty: "Infantry",
        fromDay: "01",
        fromMonth: "06",
        fromYear: "2010",
        toDay: "31",
        toMonth: "05",
        toYear: "2014"
      }
    ],
    militaryDetails: "Service details",  // Alternative field
    
    // Special Skills
    specialSkills: "N/A",                // Description or "N/A"
    
    // Security Questions (ALWAYS NO unless explicitly stated)
    insurgentOrganization: false,        // or "NO"
    talibanAssociation: false            // or "NO"
  },
  
  security: {
    // === SECURITY AND BACKGROUND PAGES ===
    
    // Part 1: Medical/Health Questions
    medicalHealth: {
      hasInfectiousDisease: "NO",        // NO unless evidence suggests otherwise
      hasMentalDisorder: "NO",           // NO unless evidence suggests otherwise
      hasDrugAbuse: "NO",                // NO unless evidence suggests otherwise
      explanation: ""                     // Explanation if any YES answers
    },
    
    // Part 2: Criminal Questions
    criminal: {
      hasArrest: "NO",                   // NO unless evidence suggests otherwise
      hasViolatedLaw: "NO",              // NO unless evidence suggests otherwise
      explanation: ""                     // Explanation if any YES answers
    },
    
    // Part 3: Security Violations
    securityViolations: {
      hasEspionage: "NO",
      hasSabotage: "NO",
      hasTerrorism: "NO",
      hasGenocide: "NO",
      hasTorture: "NO",
      hasExportControlViolations: "NO",
      explanation: ""
    },
    
    // Part 4: Immigration Violations
    immigration: {
      hasImmigrationFraud: "NO",
      hasVisaFraud: "NO",
      hasAssistOthersImmigrationFraud: "NO",
      explanation: ""
    },
    
    // Part 5: Other Violations
    other: {
      hasProstitution: "NO",
      hasHumanTrafficking: "NO",
      hasMoneyLaundering: "NO",
      hasViolatedUSVisa: "NO",
      hasChildCustodyIssue: "NO",
      explanation: ""
    }
  },
  
  // ... other sections
};
```

## Field Mapping Reference

### Gender Mapping (Updated)
```javascript
// Input format → Form value
"M" → "MALE"
"F" → "FEMALE"
"MALE" → "MALE"
"FEMALE" → "FEMALE"
```

### Marital Status Mapping (New)
```javascript
// Input format → Form value
"SINGLE" → "S"
"MARRIED" → "M"
"DIVORCED" → "D"
"WIDOWED" → "W"
"SEPARATED" → "P"
"LEGAL SEPARATION" → "L"
"CIVIL UNION" → "C"
"DOMESTIC PARTNERSHIP" → "O"
```

### Country Code Mapping
```javascript
// Common countries
"China" → "CHIN"
"Japan" → "JPN"
"United States" → "USA"
"Canada" → "CAN"
"United Kingdom" → "GBR"
"Germany" → "D"
"France" → "F"
"India" → "IND"
// Add more as needed
```

## Conditional Field Logic

### Telecode Fields
- Only appear when Chinese characters are in the name
- Set `hasTelecode: true` to fill these fields
- Leave empty or set to `false` for non-Chinese names

### "Does Not Apply" Checkboxes
The following fields have N/A checkboxes that are automatically checked when the value is "N/A" or empty:
- `fullNameNative` → checks `cbexAPP_FULL_NAME_NATIVE_NA`
- `birthState` → checks `cbexAPP_POB_ST_PROVINCE_NA`
- `nationalId` → checks `cbxAPP_NATIONAL_ID_NA`
- `usSocialSecurity` → checks `cbxAPP_SSN_NA`
- `usTaxId` → checks `cbxAPP_TAX_ID_NA`
- `previousVisa.visaNumber` → checks `cbxPREV_VISA_FOIL_NUMBER_NA` (when "N/A", "Do Not Know", or empty)

### SSN Field Splitting
If the form has separate SSN boxes, the extension automatically splits:
```javascript
"699-52-8463" → 
  Box 1: "699"
  Box 2: "52"
  Box 3: "8463"
```

## Usage Example

### Loading Data into Extension
1. Open the DS-160 form page
2. The extension will show a floating button: "🚀 Auto-Fill (All Pages Fixed)"
3. Click to fill the current page with the loaded data
4. Dynamic fields will be filled in multiple passes

### Data Storage
The extension expects data to be stored in Chrome storage or passed via message:
```javascript
// Via Chrome storage
chrome.storage.local.set({ ds160Data: data });

// Via message from popup
chrome.runtime.sendMessage({
  action: 'fillForm',
  data: ds160Data
});
```

## Testing Recommendations

### Test Personal Page 1
1. Verify gender dropdown fills correctly
2. Check marital status selection
3. Confirm birth location fields fill on Page 1
4. Test "Other Names" radio triggers dynamic fields
5. For Chinese names, verify telecode fields appear

### Test Personal Page 2
1. Verify nationality dropdown
2. Test SSN field splitting (if applicable)
3. Check N/A checkbox behavior for IDs
4. Verify tax ID formatting

## Troubleshooting

### Common Issues
1. **Gender not filling**: Check if form uses dropdown vs radio buttons
2. **Birth location empty on Page 1**: Data might be in wrong section
3. **Marital status not filling**: Field was missing in old versions
4. **Dynamic fields not appearing**: Ensure multi-pass filling is enabled
5. **Telecode fields missing**: Set `hasTelecode: true` for Chinese names

### Debug Mode
Open browser console and look for messages:
- "Current page detected: personal1"
- "Found X visible unfilled fields"
- "✓ Filled: [field_id]"
- "Could not find matching option for [field_id]"