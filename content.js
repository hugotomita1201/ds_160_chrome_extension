// Fixed Two-Pass DS-160 Auto-Filler with Complete Field Support
// Properly handles all Personal Page 1 & 2 fields including gender dropdown, marital status, birth location, telecode

console.log('DS-160 Two-Pass Auto-Filler (Complete Field Support) loaded');

// Simple configuration
const CONFIG = {
  fillDelay: 100,
  passDelay: 2500,
  maxPasses: 3,
};

class TwoPassFiller {
  constructor() {
    this.filledFields = new Set();
    this.currentData = null;
  }

  // Detect which page we're on (improved detection)
  detectCurrentPage() {
    const pageIndicators = {
      'personal1': 'tbxAPP_SURNAME',
      'personal2': 'ddlAPP_NATL', // Nationality dropdown is unique to page 2
      'travel': 'ddlPurposeOfTrip',
      'travelCompanions': 'rblTravelingWithYou',
      'previousTravel': 'rblPREV_US_TRAVEL_IND',
      'addressPhone': 'tbxAPP_ADDR_LN1',
      'usContact': 'tbxUS_POC_SURNAME',
      'passport': 'ddlPPT_TYPE',
      'family': 'tbxFATHER_SURNAME',
      'workEducation': 'ddlPresentOccupation',
      'security': 'rblDisease'
    };

    for (const [page, indicator] of Object.entries(pageIndicators)) {
      const fields = document.querySelectorAll(`[id*="${indicator}"]`);
      if (fields.length > 0 && fields[0].offsetParent !== null) {
        // Additional check for personal pages
        if (page === 'personal1' && document.querySelector('[id*="ddlAPP_NATL"]')) {
          // If nationality dropdown is visible, it's page 2
          return 'personal2';
        }
        return page;
      }
    }
    
    return 'unknown';
  }

  // Get all visible fields on the current page
  getVisibleFields() {
    const fields = [];
    const elements = document.querySelectorAll('input, select, textarea');
    
    elements.forEach(element => {
      if (element.id && element.offsetParent !== null && !element.disabled) {
        if (this.filledFields.has(element.id)) {
          return;
        }
        
        fields.push({
          id: element.id,
          type: element.type || element.tagName.toLowerCase(),
          element: element
        });
      }
    });
    
    return fields;
  }

  // Fill a field with matching data
  fillField(field, data) {
    const fieldId = field.id;
    const element = field.element;
    
    if (this.filledFields.has(fieldId)) {
      return false;
    }
    
    const value = this.findMatchingValue(fieldId, data);
    
    if (value === null || value === undefined) {
      return false;
    }
    
    try {
      if (field.type === 'text' || field.type === 'textarea' || field.type === 'tel' || field.type === 'email') {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (field.type === 'select' || field.type === 'select-one') {
        // For dropdowns, try to match the value
        const options = Array.from(element.options);
        let matched = false;
        
        // Debug logging for month dropdowns
        if (fieldId.includes('Month')) {
          console.log(`Setting month dropdown ${fieldId} with value: ${value}`);
          console.log('Available options:', options.map(o => ({ value: o.value, text: o.text })));
        }
        
        // Try exact match first
        for (const option of options) {
          if (option.value === value || option.text === value) {
            element.value = option.value;
            matched = true;
            break;
          }
        }
        
        // Try case-insensitive match
        if (!matched) {
          for (const option of options) {
            if (option.value.toLowerCase() === value.toLowerCase() || 
                option.text.toLowerCase() === value.toLowerCase()) {
              element.value = option.value;
              matched = true;
              break;
            }
          }
        }
        
        // Special handling for month dropdowns
        if (!matched && fieldId.includes('Month')) {
          // Try to match month in various formats
          const monthMappings = {
            'JAN': ['JAN', 'JANUARY', '01', '1'],
            'FEB': ['FEB', 'FEBRUARY', '02', '2'],
            'MAR': ['MAR', 'MARCH', '03', '3'],
            'APR': ['APR', 'APRIL', '04', '4'],
            'MAY': ['MAY', 'MAY', '05', '5'],
            'JUN': ['JUN', 'JUNE', '06', '6'],
            'JUL': ['JUL', 'JULY', '07', '7'],
            'AUG': ['AUG', 'AUGUST', '08', '8'],
            'SEP': ['SEP', 'SEPTEMBER', '09', '9'],
            'OCT': ['OCT', 'OCTOBER', '10', '10'],
            'NOV': ['NOV', 'NOVEMBER', '11', '11'],
            'DEC': ['DEC', 'DECEMBER', '12', '12']
          };
          
          // Find which month we're trying to set
          let targetMonth = null;
          for (const [abbr, variants] of Object.entries(monthMappings)) {
            if (value === abbr || variants.includes(value.toUpperCase())) {
              targetMonth = abbr;
              break;
            }
          }
          
          if (targetMonth) {
            // Try to find an option that matches any variant of this month
            for (const option of options) {
              const optVal = option.value.toUpperCase();
              const optText = option.text.toUpperCase();
              
              if (optVal === targetMonth || optText === targetMonth ||
                  monthMappings[targetMonth].includes(optVal) ||
                  monthMappings[targetMonth].includes(optText)) {
                element.value = option.value;
                matched = true;
                console.log(`Matched month ${targetMonth} to option value: ${option.value}`);
                break;
              }
            }
          }
        }
        
        // Try partial match for countries
        if (!matched && (fieldId.includes('NATL') || fieldId.includes('CNTRY'))) {
          const countryMap = this.getCountryMapping(value);
          if (countryMap) {
            element.value = countryMap;
            matched = true;
          }
        }
        
        if (matched) {
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          console.warn(`Could not find matching option for ${fieldId}: ${value}`);
          return false;
        }
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        if (value === true || value === 'true' || value === 'yes' || value === 'on') {
          element.checked = true;
          element.dispatchEvent(new Event('click', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      console.log(`✓ Filled: ${fieldId}`);
      this.filledFields.add(fieldId);
      return true;
    } catch (error) {
      console.error(`Error filling ${fieldId}:`, error);
      return false;
    }
  }

  // Country code mapping for dropdowns
  getCountryMapping(country) {
    const countryMappings = {
      'China': 'CHIN',
      'CHINA': 'CHIN',
      'Japan': 'JPN',
      'JAPAN': 'JPN',
      'United States': 'USA',
      'UNITED STATES': 'USA',
      'USA': 'USA',
      'US': 'USA',
      'Canada': 'CAN',
      'CANADA': 'CAN',
      // Add more as needed
    };
    
    return countryMappings[country] || null;
  }

  // Parse SSN for split fields
  parseSSN(ssn) {
    if (!ssn || ssn === 'N/A') return null;
    
    // Remove any non-numeric characters
    const cleaned = ssn.replace(/\D/g, '');
    
    if (cleaned.length !== 9) return null;
    
    return {
      part1: cleaned.substring(0, 3),
      part2: cleaned.substring(3, 5),
      part3: cleaned.substring(5, 9)
    };
  }

  // Find matching value in data for a field ID
  findMatchingValue(fieldId, data) {
    // Special handling for ALL month dropdowns - MUST come before field mappings
    // Handle date of birth month
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlDOBMonth') {
      const dateStr = data.personal?.dateOfBirth;
      console.log(`DOB Month special handling: date="${dateStr}"`);
      const month = this.getMonthNumber(dateStr);
      console.log(`DOB Month result: "${month}"`);
      return month;
    }
    
    // Handle travel date months
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth') {
      return this.getMonthNumber(data.travel?.intendedTravelDate);
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEMonth') {
      return this.getMonthNumber(data.travel?.intendedArrivalDate);
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEMonth') {
      return this.getMonthNumber(data.travel?.intendedDepartureDate);
    }
    
    // Handle passport date months
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_DTEMonth') {
      return this.getMonthNumber(data.passport?.issueDate);
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_EXPIRE_DTEMonth') {
      return this.getMonthNumber(data.passport?.expirationDate);
    }
    
    // Handle employment date month
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromMonth') {
      return this.getMonthNumber(data.workEducation?.presentEmployer?.startDate || data.workEducation?.employmentStartDate);
    }
    
    // Handle previous visa date month
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEMonth') {
      return this.getMonthNumber(data.previousTravel?.previousVisa?.issueDate);
    }
    
    // Handle previous US visit date months (dynamic fields)
    if (fieldId.includes('PREV_US_VISIT') && fieldId.includes('Month')) {
      const match = fieldId.match(/ctl(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        return this.getMonthNumber(data.previousTravel?.visits?.[index]?.arrivalDate);
      }
    }
    
    // Special handling for SSN fields
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1') {
      const ssn = this.parseSSN(data.personal?.usSocialSecurity);
      return ssn?.part1;
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN2') {
      const ssn = this.parseSSN(data.personal?.usSocialSecurity);
      return ssn?.part2;
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN3') {
      const ssn = this.parseSSN(data.personal?.usSocialSecurity);
      return ssn?.part3;
    }
    
    // Handle "Does Not Apply" checkboxes - FIXED: cbex not cbx
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA') {
      return data.personal?.nationalId === 'N/A' || !data.personal?.nationalId;
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA') {
      return data.personal?.usSocialSecurity === 'N/A' || !data.personal?.usSocialSecurity;
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA') {
      return data.personal?.usTaxId === 'N/A' || !data.personal?.usTaxId;
    }
    // Personal Page 1 "Does Not Apply" checkboxes
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_FULL_NAME_NATIVE_NA') {
      return !data.personal?.fullNameNative || data.personal?.fullNameNative === 'N/A';
    }
    if (fieldId === 'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_POB_ST_PROVINCE_NA') {
      return !data.personal?.birthState || data.personal?.birthState === 'N/A';
    }
    
    // Direct field mappings
    const fieldMappings = {
      // Personal Information Page 1
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME': data.personal?.surname,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME': data.personal?.givenName,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE': data.personal?.fullNameNative,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlDOBDay': this.parseDate(data.personal?.dateOfBirth)?.day,
      // Month will be handled specially in findMatchingValue to ensure proper conversion
      'ctl00_SiteContentPlaceHolder_FormView1_ddlDOBMonth': null, // Special handling in findMatchingValue
      'ctl00_SiteContentPlaceHolder_FormView1_tbxDOBYear': this.parseDate(data.personal?.dateOfBirth)?.year,
      
      // Gender - Now a dropdown instead of radio buttons
      'ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_GENDER': this.mapGender(data.personal?.gender),
      
      // Marital Status - Was missing
      'ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS': this.mapMaritalStatus(data.personal?.maritalStatus),
      
      // Birth Location - These are on Page 1, NOT Page 2!
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY': data.personal?.birthCity,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_ST_PROVINCE': data.personal?.birthState,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY': data.personal?.birthCountry,
      
      // Other names (dynamic)
      'ctl00_SiteContentPlaceHolder_FormView1_DListAlias_ctl00_tbxSURNAME': data.personal?.otherNames?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_DListAlias_ctl00_tbxGIVEN_NAME': '', // Often just the name variation
      
      // Telecode fields (conditional - for Chinese names)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TelecodeSURNAME': data.personal?.telecodeSurname,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TelecodeGIVEN_NAME': data.personal?.telecodeGivenName,
      
      // Personal Information Page 2 - CRITICAL FIELDS
      'ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_NATL': data.personal?.nationality,
      
      // Dynamic fields for other nationalities (conditional - appear when "Yes" selected)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL': data.personal?.otherNationalities?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl01_ddlOTHER_NATL': data.personal?.otherNationalities?.[1],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM': data.personal?.otherPassportNumbers?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl01_tbxOTHER_PPT_NUM': data.personal?.otherPassportNumbers?.[1],
      
      // Permanent resident country (conditional - appears when permanent resident = "Yes")
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry': data.personal?.permanentResidentCountry,
      
      // National ID - only fill if not N/A
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID': 
        (data.personal?.nationalId && data.personal.nationalId !== 'N/A') ? data.personal.nationalId : '',
      
      // SSN - single field version (some forms have this)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN': 
        (data.personal?.usSocialSecurity && data.personal.usSocialSecurity !== 'N/A') ? 
        data.personal.usSocialSecurity.replace(/-/g, '') : '',
      
      // Tax ID - only fill if not N/A
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TAX_ID': 
        (data.personal?.usTaxId && data.personal.usTaxId !== 'N/A') ? data.personal.usTaxId : '',
      
      // === TRAVEL INFORMATION PAGE ===
      
      // Purpose of Trip
      'ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_ddlPurposeOfTrip': this.mapPurposeOfTrip(data.travel?.purposeOfTrip),
      'ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_ddlOtherPurpose': data.travel?.otherPurposeDetail,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxSpecifyOther': data.travel?.purposeSpecify,
      
      // Who is Paying
      'ctl00_SiteContentPlaceHolder_FormView1_ddlWhoIsPaying': this.mapPayerType(data.travel?.tripPayer),
      
      // Principal Applicant (for dependents)
      'ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppSurname': data.travel?.principalApplicant?.surname,
      'ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPrincipleAppGivenName': data.travel?.principalApplicant?.givenName,
      'ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_tbxPRIN_APP_PETITION_NUM': data.travel?.principalApplicant?.petitionNumber,
      
      // Intended Travel Date
      'ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEDay': this.parseDate(data.travel?.intendedTravelDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth': this.getMonthNumber(data.travel?.intendedTravelDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_DTEYear': this.parseDate(data.travel?.intendedTravelDate)?.year,
      
      // Length of Stay
      'ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_LOS': data.travel?.lengthOfStayNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_LOS_CD': this.mapStayUnit(data.travel?.lengthOfStayUnit),
      
      // Arrival Information
      'ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEDay': this.parseDate(data.travel?.intendedArrivalDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEMonth': this.getMonthNumber(data.travel?.intendedArrivalDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxARRIVAL_US_DTEYear': this.parseDate(data.travel?.intendedArrivalDate)?.year,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxArriveFlight': data.travel?.arrivalFlightNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxArriveCity': data.travel?.arrivalCity,
      
      // Departure Information
      'ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEDay': this.parseDate(data.travel?.intendedDepartureDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEMonth': this.getMonthNumber(data.travel?.intendedDepartureDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxDEPARTURE_US_DTEYear': this.parseDate(data.travel?.intendedDepartureDate)?.year,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxDepartFlight': data.travel?.departureFlightNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxDepartCity': data.travel?.departureCity,
      
      // US Address/Hotel Information
      'ctl00_SiteContentPlaceHolder_FormView1_dtlTravelLoc_ctl00_tbxSPECTRAVEL_LOCATION': data.travel?.usContactName,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxStreetAddress1': data.travel?.usStreetAddress,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxStreetAddress2': data.travel?.usStreetAddress2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxCity': data.travel?.usCity,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlTravelState': data.travel?.usState,
      'ctl00_SiteContentPlaceHolder_FormView1_tbZIPCode': data.travel?.usZipCode,
      
      // Payer Information (Person)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerSurname': data.travel?.payerInfo?.surname,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerGivenName': data.travel?.payerInfo?.givenName,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerPhone': data.travel?.payerInfo?.phone,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPAYER_EMAIL_ADDR': data.travel?.payerInfo?.email,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPayerRelationship': data.travel?.payerInfo?.relationship,
      
      // Payer Company Information
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayingCompany': data.travel?.companyInfo?.name,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxCompanyRelation': data.travel?.companyInfo?.relationship,
      
      // Payer Address
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerStreetAddress1': data.travel?.payerInfo?.address1,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerStreetAddress2': data.travel?.payerInfo?.address2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerCity': data.travel?.payerInfo?.city,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerStateProvince': data.travel?.payerInfo?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPayerPostalZIPCode': data.travel?.payerInfo?.zipCode,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPayerCountry': data.travel?.payerInfo?.country,
      
      // Mission/Organization Fields (for religious/official visas)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrg': data.travel?.missionOrg?.name,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactSurname': data.travel?.missionOrg?.contactSurname,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgContactGivenName': data.travel?.missionOrg?.contactGivenName,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgAddress1': data.travel?.missionOrg?.address1,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgAddress2': data.travel?.missionOrg?.address2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgCity': data.travel?.missionOrg?.city,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlMissionOrgState': data.travel?.missionOrg?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgZipCode': data.travel?.missionOrg?.zipCode,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMissionOrgTel': data.travel?.missionOrg?.phone,
      
      // === PREVIOUS U.S. TRAVEL PAGE ===
      
      // Previous US Visit Information (dynamic fields - ctl00 for first visit, ctl01 for second, etc.)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEDay': 
        this.parseDate(data.previousTravel?.visits?.[0]?.arrivalDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEMonth': 
        this.getMonthNumber(data.previousTravel?.visits?.[0]?.arrivalDate),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_DTEYear': 
        this.parseDate(data.previousTravel?.visits?.[0]?.arrivalDate)?.year,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_LOS': 
        data.previousTravel?.visits?.[0]?.lengthOfStayNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_LOS_CD': 
        this.mapStayUnit(data.previousTravel?.visits?.[0]?.lengthOfStayUnit),
      
      // Additional visits (up to 5)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl01_ddlPREV_US_VISIT_DTEDay': 
        this.parseDate(data.previousTravel?.visits?.[1]?.arrivalDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl01_ddlPREV_US_VISIT_DTEMonth': 
        this.getMonthNumber(data.previousTravel?.visits?.[1]?.arrivalDate),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl01_tbxPREV_US_VISIT_DTEYear': 
        this.parseDate(data.previousTravel?.visits?.[1]?.arrivalDate)?.year,
      
      // US Driver's License
      'ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_tbxUS_DRIVER_LICENSE': 
        data.previousTravel?.driverLicense?.number,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_ddlUS_DRIVER_LICENSE_STATE': 
        data.previousTravel?.driverLicense?.state,
      
      // Previous Visa Information
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEDay': 
        this.parseDate(data.previousTravel?.previousVisa?.issueDate)?.day,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEMonth': 
        this.getMonthNumber(data.previousTravel?.previousVisa?.issueDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_ISSUED_DTEYear': 
        this.parseDate(data.previousTravel?.previousVisa?.issueDate)?.year,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_FOIL_NUMBER': 
        data.previousTravel?.previousVisa?.visaNumber,
      
      // Explanation Fields
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_YEAR': 
        data.previousTravel?.previousVisa?.lostYear,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_EXPL': 
        data.previousTravel?.previousVisa?.lostExplanation,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_CANCELLED_EXPL': 
        data.previousTravel?.previousVisa?.cancelledExplanation,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_REFUSED_EXPL': 
        data.previousTravel?.visaRefusedExplanation,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPERM_RESIDENT_EXPL': 
        data.previousTravel?.permanentResidentExplanation,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxIV_PETITION_EXPL': 
        data.previousTravel?.immigrantPetitionExplanation,
      
      // All other existing mappings...
    };

    // Handle radio buttons
    const radioMappings = {
      // Gender - Keeping for backward compatibility (some forms may still use radio buttons)
      'ctl00_SiteContentPlaceHolder_FormView1_rblAPP_GENDER_0': data.personal?.gender === 'M' || data.personal?.gender === 'MALE',
      'ctl00_SiteContentPlaceHolder_FormView1_rblAPP_GENDER_1': data.personal?.gender === 'F' || data.personal?.gender === 'FEMALE',
      
      // Other names
      'ctl00_SiteContentPlaceHolder_FormView1_rblOtherNames_0': data.personal?.otherNames?.length > 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblOtherNames_1': !data.personal?.otherNames?.length || data.personal?.otherNames?.length === 0,
      
      // Telecode question (for Chinese names)
      'ctl00_SiteContentPlaceHolder_FormView1_rblTelecodeQuestion_0': 
        data.personal?.hasTelecode === true || data.personal?.hasTelecode === 'yes',
      'ctl00_SiteContentPlaceHolder_FormView1_rblTelecodeQuestion_1': 
        data.personal?.hasTelecode === false || data.personal?.hasTelecode === 'no' || !data.personal?.hasTelecode,
      
      // Personal Page 2 specific radios
      'ctl00_SiteContentPlaceHolder_FormView1_rblAPP_OTH_NATL_IND_0': 
        data.personal?.otherNationalities?.length > 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblAPP_OTH_NATL_IND_1': 
        !data.personal?.otherNationalities?.length || data.personal?.otherNationalities?.length === 0,
      
      // Has passport for other nationality (dynamic fields)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_rblOTHER_PPT_IND_0': 
        data.personal?.otherNationalityPassports?.[0] === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_rblOTHER_PPT_IND_1': 
        data.personal?.otherNationalityPassports?.[0] === false || !data.personal?.otherNationalityPassports?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl01_rblOTHER_PPT_IND_0': 
        data.personal?.otherNationalityPassports?.[1] === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl01_rblOTHER_PPT_IND_1': 
        data.personal?.otherNationalityPassports?.[1] === false || !data.personal?.otherNationalityPassports?.[1],
      
      // Permanent resident
      'ctl00_SiteContentPlaceHolder_FormView1_rblPermResOtherCntryInd_0': 
        data.personal?.permanentResident === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPermResOtherCntryInd_1': 
        data.personal?.permanentResident === false || !data.personal?.permanentResident,
      
      // === TRAVEL PAGE RADIO BUTTONS ===
      
      // Specific travel plans
      'ctl00_SiteContentPlaceHolder_FormView1_rblSpecificTravel_0': 
        data.travel?.specificTravelPlans === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblSpecificTravel_1': 
        data.travel?.specificTravelPlans === false || !data.travel?.specificTravelPlans,
      
      // Payer address same as applicant
      'ctl00_SiteContentPlaceHolder_FormView1_rblPayerAddrSameAsInd_0': 
        data.travel?.payerInfo?.sameAddress === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPayerAddrSameAsInd_1': 
        data.travel?.payerInfo?.sameAddress === false || !data.travel?.payerInfo?.sameAddress,
      
      // === PREVIOUS U.S. TRAVEL PAGE RADIO BUTTONS ===
      
      // Been to US before
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_TRAVEL_IND_0': 
        data.previousTravel?.hasBeenToUS === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_TRAVEL_IND_1': 
        data.previousTravel?.hasBeenToUS === false || !data.previousTravel?.hasBeenToUS,
      
      // Had US visa before
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_IND_0': 
        data.previousTravel?.previousVisa?.hasVisa === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_IND_1': 
        data.previousTravel?.previousVisa?.hasVisa === false || !data.previousTravel?.previousVisa?.hasVisa,
      
      // Visa refused
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_REFUSED_IND_0': 
        data.previousTravel?.visaRefused === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_REFUSED_IND_1': 
        data.previousTravel?.visaRefused === false || !data.previousTravel?.visaRefused,
      
      // Applied for permanent residence
      'ctl00_SiteContentPlaceHolder_FormView1_rblPERM_RESIDENT_IND_0': 
        data.previousTravel?.appliedForPermanentResident === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPERM_RESIDENT_IND_1': 
        data.previousTravel?.appliedForPermanentResident === false || !data.previousTravel?.appliedForPermanentResident,
      
      // Immigrant petition filed
      'ctl00_SiteContentPlaceHolder_FormView1_rblIV_PETITION_IND_0': 
        data.previousTravel?.immigrantPetition === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblIV_PETITION_IND_1': 
        data.previousTravel?.immigrantPetition === false || !data.previousTravel?.immigrantPetition,
      
      // US Driver's License
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND_0': 
        data.previousTravel?.driverLicense?.hasLicense === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND_1': 
        data.previousTravel?.driverLicense?.hasLicense === false || !data.previousTravel?.driverLicense?.hasLicense,
      
      // Previous visa questions
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_TYPE_IND_0': 
        data.previousTravel?.previousVisa?.sameType === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_TYPE_IND_1': 
        data.previousTravel?.previousVisa?.sameType === false || !data.previousTravel?.previousVisa?.sameType,
      
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_CNTRY_IND_0': 
        data.previousTravel?.previousVisa?.sameCountry === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_CNTRY_IND_1': 
        data.previousTravel?.previousVisa?.sameCountry === false || !data.previousTravel?.previousVisa?.sameCountry,
      
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_TEN_PRINT_IND_0': 
        data.previousTravel?.previousVisa?.tenPrinted === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_TEN_PRINT_IND_1': 
        data.previousTravel?.previousVisa?.tenPrinted === false || !data.previousTravel?.previousVisa?.tenPrinted,
      
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_LOST_IND_0': 
        data.previousTravel?.previousVisa?.lost === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_LOST_IND_1': 
        data.previousTravel?.previousVisa?.lost === false || !data.previousTravel?.previousVisa?.lost,
      
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_CANCELLED_IND_0': 
        data.previousTravel?.previousVisa?.cancelled === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_CANCELLED_IND_1': 
        data.previousTravel?.previousVisa?.cancelled === false || !data.previousTravel?.previousVisa?.cancelled,
      
      // All other existing radio mappings...
      
      // === ADDRESS AND PHONE PAGE ===
      // Home Address
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_LN1': data.contact?.homeStreet,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_LN2': data.contact?.homeStreet2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_CITY': data.contact?.homeCity,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_STATE': data.contact?.homeState,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_ADDR_STATE_NA': 
        !data.contact?.homeState || data.contact?.homeState === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_POSTAL_CD': data.contact?.homePostalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_ADDR_POSTAL_CD_NA': 
        !data.contact?.homePostalCode || data.contact?.homePostalCode === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_ddlCountry': this.mapCountry(data.contact?.homeCountry),
      
      // Mailing Address Same as Home
      'ctl00_SiteContentPlaceHolder_FormView1_rblMailingAddrSame_0': 
        data.contact?.mailingSameAsHome === true || data.contact?.mailingSameAsHome === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblMailingAddrSame_1': 
        data.contact?.mailingSameAsHome === false || data.contact?.mailingSameAsHome === 'NO',
      
      // Phone Numbers
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_HOME_TEL': data.contact?.primaryPhone || data.contact?.homePhone,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_MOBILE_TEL': data.contact?.secondaryPhone,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_MOBILE_TEL_NA': 
        !data.contact?.secondaryPhone || data.contact?.secondaryPhone === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_BUS_TEL': data.contact?.workPhone,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_BUS_TEL_NA': 
        !data.contact?.workPhone || data.contact?.workPhone === 'N/A',
      
      // Additional Phones
      'ctl00_SiteContentPlaceHolder_FormView1_rblAddPhone_0': 
        data.contact?.hasOtherPhones === 'YES' || (data.contact?.otherPhones && data.contact?.otherPhones.length > 0),
      'ctl00_SiteContentPlaceHolder_FormView1_rblAddPhone_1': 
        data.contact?.hasOtherPhones === 'NO' || !data.contact?.otherPhones || data.contact?.otherPhones.length === 0,
      
      // Email
      'ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_EMAIL_ADDR': 
        data.contact?.email || data.contact?.emailAddress,
      
      // Additional Emails
      'ctl00_SiteContentPlaceHolder_FormView1_rblAddEmail_0': 
        data.contact?.hasOtherEmails === 'YES' || (data.contact?.otherEmails && data.contact?.otherEmails.length > 0),
      'ctl00_SiteContentPlaceHolder_FormView1_rblAddEmail_1': 
        data.contact?.hasOtherEmails === 'NO' || !data.contact?.otherEmails || data.contact?.otherEmails.length === 0,
      
      // Dynamic Mailing Address fields (appear when mailing address different from home)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN1': 
        data.contact?.mailingStreet || data.contact?.mailingAddress?.street,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_LN2': 
        data.contact?.mailingAddress?.apt,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_CITY': 
        data.contact?.mailingCity || data.contact?.mailingAddress?.city,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_STATE': 
        data.contact?.mailingState || data.contact?.mailingAddress?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_STATE_NA': 
        !data.contact?.mailingState && !data.contact?.mailingAddress?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxMAILING_ADDR_POSTAL_CD': 
        data.contact?.mailingPostalCode || data.contact?.mailingAddress?.postalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexMAILING_ADDR_POSTAL_CD_NA': 
        !data.contact?.mailingPostalCode && !data.contact?.mailingAddress?.postalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlMailCountry': 
        this.mapCountry(data.contact?.mailingCountry || data.contact?.mailingAddress?.country),
      
      // Dynamic Additional Phone Numbers (appear when has other phones = Yes)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddPhone_ctl00_tbxAddPhoneInfo': data.contact?.otherPhones?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddPhone_ctl01_tbxAddPhoneInfo': data.contact?.otherPhones?.[1],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddPhone_ctl02_tbxAddPhoneInfo': data.contact?.otherPhones?.[2],
      
      // Dynamic Additional Email Addresses (appear when has other emails = Yes)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddEmail_ctl00_tbxAddEmailInfo': data.contact?.otherEmails?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddEmail_ctl01_tbxAddEmailInfo': data.contact?.otherEmails?.[1],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlAddEmail_ctl02_tbxAddEmailInfo': data.contact?.otherEmails?.[2],
      
      // === PASSPORT INFORMATION PAGE ===
      // Passport Type and Number
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE': this.mapPassportType(data.passport?.type),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_NUM': data.passport?.number || data.passport?.passportNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_BOOK_NUM': data.passport?.bookNumber || data.passport?.passportBookNumber,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA': 
        !data.passport?.bookNumber || data.passport?.bookNumber === 'N/A',
      
      // Passport Issuance
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_CNTRY': 
        this.mapCountry(data.passport?.issuingAuthority || data.passport?.issueCountry),
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_IN_CNTRY': 
        this.mapCountry(data.passport?.issueCountry || data.passport?.countryOfIssuance),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUED_IN_CITY': data.passport?.issueCity,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUED_IN_STATE': data.passport?.issueState,
      
      // Issue Date (split into day/month/year)
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_DTEDay': 
        this.getDayFromDate(data.passport?.issueDate),
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_DTEMonth': 
        this.getMonthNumber(data.passport?.issueDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUEDYear': 
        this.getYearFromDate(data.passport?.issueDate),
      
      // Expiration Date (split into day/month/year)
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_EXPIRE_DTEDay': 
        this.getDayFromDate(data.passport?.expirationDate),
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_EXPIRE_DTEMonth': 
        this.getMonthNumber(data.passport?.expirationDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_EXPIREYear': 
        this.getYearFromDate(data.passport?.expirationDate),
      
      // Expiration N/A checkbox (some passports don't expire)
      'ctl00_SiteContentPlaceHolder_FormView1_cbxPPT_EXPIRE_NA': 
        data.passport?.expirationDate === 'N/A' || data.passport?.noExpiration === true,
      
      // Lost/Stolen Passport
      'ctl00_SiteContentPlaceHolder_FormView1_rblLOST_PPT_IND_0': 
        data.passport?.lostPassport?.hasLost === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblLOST_PPT_IND_1': 
        data.passport?.lostPassport?.hasLost === false || !data.passport?.lostPassport?.hasLost,
      
      // Other passport type explanation (for diplomatic/official passports)
      'ctl00_SiteContentPlaceHolder_FormView1_tbxPptOtherExpl': data.passport?.otherTypeExplanation,
      
      // Dynamic Lost Passport Details (appear when lost passport = Yes)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_NUM': 
        data.passport?.lostPassport?.number,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_cbxLOST_PPT_NUM_UNKN_IND': 
        !data.passport?.lostPassport?.number || data.passport?.lostPassport?.number === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_ddlLOST_PPT_NATL': 
        this.mapCountry(data.passport?.lostPassport?.country),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLostPPT_ctl00_tbxLOST_PPT_EXPL': 
        data.passport?.lostPassport?.explanation,
      
      // === U.S. POINT OF CONTACT INFORMATION PAGE ===
      // Contact Person
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME': 
        data.usPointOfContact?.contactName?.split(' ').slice(-1)[0] || data.usPointOfContact?.contactSurname,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_GIVEN_NAME': 
        data.usPointOfContact?.contactName?.split(' ').slice(0, -1).join(' ') || data.usPointOfContact?.contactGivenName,
      'ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_NAME_NA': 
        !data.usPointOfContact?.contactName && !data.usPointOfContact?.contactSurname,
      
      // Organization
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ORGANIZATION': 
        data.usPointOfContact?.contactOrganization || data.usPointOfContact?.organization,
      'ctl00_SiteContentPlaceHolder_FormView1_cbxUS_POC_ORG_NA_IND': 
        !data.usPointOfContact?.contactOrganization && !data.usPointOfContact?.organization,
      
      // Relationship
      'ctl00_SiteContentPlaceHolder_FormView1_ddlUS_POC_REL_TO_APP': 
        this.mapRelationship(data.usPointOfContact?.contactRelationship || data.usPointOfContact?.relationship),
      
      // Contact Address
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_LN1': 
        data.usPointOfContact?.contactAddress1 || data.usPointOfContact?.address?.street1,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_LN2': 
        data.usPointOfContact?.contactAddress2 || data.usPointOfContact?.address?.street2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_CITY': 
        data.usPointOfContact?.contactCity || data.usPointOfContact?.address?.city,
      'ctl00_SiteContentPlaceHolder_FormView1_ddlUS_POC_ADDR_STATE': 
        data.usPointOfContact?.contactState || data.usPointOfContact?.address?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_POSTAL_CD': 
        data.usPointOfContact?.contactZipCode || data.usPointOfContact?.address?.zipCode,
      
      // Contact Information
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_HOME_TEL': 
        data.usPointOfContact?.contactPhone || data.usPointOfContact?.phone,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_EMAIL_ADDR': 
        data.usPointOfContact?.contactEmail || data.usPointOfContact?.email,
      'ctl00_SiteContentPlaceHolder_FormView1_cbexUS_POC_EMAIL_ADDR_NA': 
        !data.usPointOfContact?.contactEmail && !data.usPointOfContact?.email,
      
      // === PRESENT WORK/EDUCATION/TRAINING INFORMATION PAGE ===
      // Primary Occupation
      'ctl00_SiteContentPlaceHolder_FormView1_ddlPresentOccupation': 
        this.mapOccupation(data.workEducation?.primaryOccupation),
      
      // Employer/School Information
      'ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchName': 
        data.workEducation?.presentEmployer?.name || data.workEducation?.employerName,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr1': 
        data.workEducation?.presentEmployer?.address?.street1 || data.workEducation?.employerAddress,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr2': 
        data.workEducation?.presentEmployer?.address?.street2,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchCity': 
        data.workEducation?.presentEmployer?.address?.city,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_STATE': 
        data.workEducation?.presentEmployer?.address?.state,
      'ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_STATE_NA': 
        !data.workEducation?.presentEmployer?.address?.state || 
        data.workEducation?.presentEmployer?.address?.state === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_ADDR_POSTAL_CD': 
        data.workEducation?.presentEmployer?.address?.postalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_cbxWORK_EDUC_ADDR_POSTAL_CD_NA': 
        !data.workEducation?.presentEmployer?.address?.postalCode || 
        data.workEducation?.presentEmployer?.address?.postalCode === 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_ddlEmpSchCountry': 
        this.mapCountry(data.workEducation?.presentEmployer?.address?.country),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_TEL': 
        data.workEducation?.presentEmployer?.phone || data.workEducation?.employerPhone,
      
      // Employment Start Date
      'ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromDay': 
        this.getDayFromDate(data.workEducation?.presentEmployer?.startDate || data.workEducation?.employmentStartDate),
      'ctl00_SiteContentPlaceHolder_FormView1_ddlEmpDateFromMonth': 
        this.getMonthNumber(data.workEducation?.presentEmployer?.startDate || data.workEducation?.employmentStartDate),
      'ctl00_SiteContentPlaceHolder_FormView1_tbxEmpDateFromYear': 
        this.getYearFromDate(data.workEducation?.presentEmployer?.startDate || data.workEducation?.employmentStartDate),
      
      // Salary and Duties
      'ctl00_SiteContentPlaceHolder_FormView1_tbxCURR_MONTHLY_SALARY': 
        data.workEducation?.presentEmployer?.monthlyIncome || data.workEducation?.monthlyIncome,
      'ctl00_SiteContentPlaceHolder_FormView1_cbxCURR_MONTHLY_SALARY_NA': 
        !data.workEducation?.presentEmployer?.monthlyIncome && !data.workEducation?.monthlyIncome,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxDescribeDuties': 
        data.workEducation?.presentEmployer?.duties || data.workEducation?.jobDuties,
      
      // === PREVIOUS WORK/EDUCATION/TRAINING INFORMATION PAGE ===
      // Main Questions
      'ctl00_SiteContentPlaceHolder_FormView1_rblPreviouslyEmployed_0': 
        data.workEducation?.previousEmployers && data.workEducation?.previousEmployers.length > 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblPreviouslyEmployed_1': 
        !data.workEducation?.previousEmployers || data.workEducation?.previousEmployers.length === 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblOtherEduc_0': 
        data.workEducation?.previousEducation && data.workEducation?.previousEducation.length > 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblOtherEduc_1': 
        !data.workEducation?.previousEducation || data.workEducation?.previousEducation.length === 0,
      
      // Dynamic Previous Employers (up to 5 entries typically)
      // First Employer (ctl00)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerName': 
        data.workEducation?.previousEmployers?.[0]?.employerName,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerStreetAddress1': 
        data.workEducation?.previousEmployers?.[0]?.employerStreetAddress1,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerStreetAddress2': 
        data.workEducation?.previousEmployers?.[0]?.employerStreetAddress2,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerCity': 
        data.workEducation?.previousEmployers?.[0]?.employerCity,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxPREV_EMPL_ADDR_STATE': 
        data.workEducation?.previousEmployers?.[0]?.employerState,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxPREV_EMPL_ADDR_STATE_NA': 
        !data.workEducation?.previousEmployers?.[0]?.employerState || 
        data.workEducation?.previousEmployers?.[0]?.employerStateNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxPREV_EMPL_ADDR_POSTAL_CD': 
        data.workEducation?.previousEmployers?.[0]?.employerPostalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxPREV_EMPL_ADDR_POSTAL_CD_NA': 
        !data.workEducation?.previousEmployers?.[0]?.employerPostalCode || 
        data.workEducation?.previousEmployers?.[0]?.employerPostalCodeNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_DropDownList2': 
        this.mapCountry(data.workEducation?.previousEmployers?.[0]?.employerCountry),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbEmployerPhone': 
        data.workEducation?.previousEmployers?.[0]?.employerPhone,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbJobTitle': 
        data.workEducation?.previousEmployers?.[0]?.jobTitle,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbSupervisorSurname': 
        data.workEducation?.previousEmployers?.[0]?.supervisorSurname,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxSupervisorSurname_NA': 
        !data.workEducation?.previousEmployers?.[0]?.supervisorSurname || 
        data.workEducation?.previousEmployers?.[0]?.supervisorSurnameNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbSupervisorGivenName': 
        data.workEducation?.previousEmployers?.[0]?.supervisorGivenName,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_cbxSupervisorGivenName_NA': 
        !data.workEducation?.previousEmployers?.[0]?.supervisorGivenName || 
        data.workEducation?.previousEmployers?.[0]?.supervisorGivenNameNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateFromDay': 
        data.workEducation?.previousEmployers?.[0]?.empDateFromDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateFromMonth': 
        data.workEducation?.previousEmployers?.[0]?.empDateFromMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxEmpDateFromYear': 
        data.workEducation?.previousEmployers?.[0]?.empDateFromYear,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateToDay': 
        data.workEducation?.previousEmployers?.[0]?.empDateToDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_ddlEmpDateToMonth': 
        data.workEducation?.previousEmployers?.[0]?.empDateToMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbxEmpDateToYear': 
        data.workEducation?.previousEmployers?.[0]?.empDateToYear,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl00_tbDescribeDuties': 
        data.workEducation?.previousEmployers?.[0]?.describeDuties,
      
      // Second Employer (ctl01) - if exists
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl01_tbEmployerName': 
        data.workEducation?.previousEmployers?.[1]?.employerName,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEmpl_ctl01_tbJobTitle': 
        data.workEducation?.previousEmployers?.[1]?.jobTitle,
      
      // Dynamic Previous Education (up to 5 entries typically)
      // First School (ctl00)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolName': 
        data.workEducation?.previousEducation?.[0]?.schoolName,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolAddr1': 
        data.workEducation?.previousEducation?.[0]?.schoolAddr1,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolAddr2': 
        data.workEducation?.previousEducation?.[0]?.schoolAddr2,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolCity': 
        data.workEducation?.previousEducation?.[0]?.schoolCity,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxEDUC_INST_ADDR_STATE': 
        data.workEducation?.previousEducation?.[0]?.educInstAddrState,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_cbxEDUC_INST_ADDR_STATE_NA': 
        !data.workEducation?.previousEducation?.[0]?.educInstAddrState || 
        data.workEducation?.previousEducation?.[0]?.educInstAddrStateNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxEDUC_INST_POSTAL_CD': 
        data.workEducation?.previousEducation?.[0]?.educInstPostalCode,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_cbxEDUC_INST_POSTAL_CD_NA': 
        !data.workEducation?.previousEducation?.[0]?.educInstPostalCode || 
        data.workEducation?.previousEducation?.[0]?.educInstPostalCodeNA === true,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolCountry': 
        this.mapCountry(data.workEducation?.previousEducation?.[0]?.schoolCountry),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolCourseOfStudy': 
        data.workEducation?.previousEducation?.[0]?.schoolCourseOfStudy,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolFromDay': 
        data.workEducation?.previousEducation?.[0]?.schoolFromDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolFromMonth': 
        data.workEducation?.previousEducation?.[0]?.schoolFromMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolFromYear': 
        data.workEducation?.previousEducation?.[0]?.schoolFromYear,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolToDay': 
        data.workEducation?.previousEducation?.[0]?.schoolToDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_ddlSchoolToMonth': 
        data.workEducation?.previousEducation?.[0]?.schoolToMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlPrevEduc_ctl00_tbxSchoolToYear': 
        data.workEducation?.previousEducation?.[0]?.schoolToYear,
      
      // === ADDITIONAL WORK/EDUCATION/TRAINING INFORMATION PAGE ===
      // Languages
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLANGUAGES_ctl00_tbxLANGUAGE_NAME': 
        data.workEducation?.languages?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLANGUAGES_ctl01_tbxLANGUAGE_NAME': 
        data.workEducation?.languages?.[1],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlLANGUAGES_ctl02_tbxLANGUAGE_NAME': 
        data.workEducation?.languages?.[2],
      
      // Countries Visited in Last 5 Years
      'ctl00_SiteContentPlaceHolder_FormView1_rblCOUNTRIES_VISITED_IND_0': 
        data.workEducation?.countriesVisited5Years && data.workEducation?.countriesVisited5Years.length > 0,
      'ctl00_SiteContentPlaceHolder_FormView1_rblCOUNTRIES_VISITED_IND_1': 
        !data.workEducation?.countriesVisited5Years || data.workEducation?.countriesVisited5Years.length === 0,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl00_ddlCOUNTRIES_VISITED': 
        this.mapCountry(data.workEducation?.countriesVisited5Years?.[0]),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl01_ddlCOUNTRIES_VISITED': 
        this.mapCountry(data.workEducation?.countriesVisited5Years?.[1]),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl02_ddlCOUNTRIES_VISITED': 
        this.mapCountry(data.workEducation?.countriesVisited5Years?.[2]),
      
      // Clan/Tribe Membership
      'ctl00_SiteContentPlaceHolder_FormView1_rblCLAN_TRIBE_IND_0': 
        data.workEducation?.clanTribeMembership === 'YES' || data.workEducation?.clanTribeMembership === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblCLAN_TRIBE_IND_1': 
        data.workEducation?.clanTribeMembership === 'NO' || data.workEducation?.clanTribeMembership === false || 
        !data.workEducation?.clanTribeMembership,
      'ctl00_SiteContentPlaceHolder_FormView1_tbxCLAN_TRIBE_NAME': 
        data.workEducation?.clanTribeName,
      
      // Organization Membership
      'ctl00_SiteContentPlaceHolder_FormView1_rblORGANIZATION_IND_0': 
        data.workEducation?.organizationMembership === 'YES' || 
        (data.workEducation?.organizations && data.workEducation?.organizations.length > 0),
      'ctl00_SiteContentPlaceHolder_FormView1_rblORGANIZATION_IND_1': 
        data.workEducation?.organizationMembership === 'NO' || 
        !data.workEducation?.organizations || data.workEducation?.organizations.length === 0,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlORGANIZATIONS_ctl00_tbxORGANIZATION_NAME': 
        data.workEducation?.organizations?.[0],
      'ctl00_SiteContentPlaceHolder_FormView1_dtlORGANIZATIONS_ctl01_tbxORGANIZATION_NAME': 
        data.workEducation?.organizations?.[1],
      
      // Military Service
      'ctl00_SiteContentPlaceHolder_FormView1_rblMILITARY_SERVICE_IND_0': 
        data.workEducation?.hasMilitaryService === 'YES' || data.workEducation?.hasMilitaryService === true,
      'ctl00_SiteContentPlaceHolder_FormView1_rblMILITARY_SERVICE_IND_1': 
        data.workEducation?.hasMilitaryService === 'NO' || data.workEducation?.hasMilitaryService === false || 
        !data.workEducation?.hasMilitaryService,
      
      // Military Service Details (dynamic)
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_CNTRY': 
        this.mapCountry(data.workEducation?.militaryService?.[0]?.country),
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_BRANCH': 
        data.workEducation?.militaryService?.[0]?.branch,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_RANK': 
        data.workEducation?.militaryService?.[0]?.rank,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_SPECIALTY': 
        data.workEducation?.militaryService?.[0]?.specialty,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_FROMDay': 
        data.workEducation?.militaryService?.[0]?.fromDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_FROMMonth': 
        data.workEducation?.militaryService?.[0]?.fromMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_FROMYear': 
        data.workEducation?.militaryService?.[0]?.fromYear,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_TODay': 
        data.workEducation?.militaryService?.[0]?.toDay,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_TOMonth': 
        data.workEducation?.militaryService?.[0]?.toMonth,
      'ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_TOYear': 
        data.workEducation?.militaryService?.[0]?.toYear,
      
      // Specialized Skills
      'ctl00_SiteContentPlaceHolder_FormView1_rblSPECIALIZED_SKILLS_IND_0': 
        data.workEducation?.specialSkills && data.workEducation?.specialSkills !== 'N/A',
      'ctl00_SiteContentPlaceHolder_FormView1_rblSPECIALIZED_SKILLS_IND_1': 
        !data.workEducation?.specialSkills || data.workEducation?.specialSkills === 'N/A',
      
      // Security Questions (Default to NO unless explicitly stated)
      'ctl00_SiteContentPlaceHolder_FormView1_rblINSURGENT_ORG_IND_0': 
        data.workEducation?.insurgentOrganization === true || data.workEducation?.insurgentOrganization === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblINSURGENT_ORG_IND_1': 
        data.workEducation?.insurgentOrganization !== true && data.workEducation?.insurgentOrganization !== 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblTALIBAN_IND_0': 
        data.workEducation?.talibanAssociation === true || data.workEducation?.talibanAssociation === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblTALIBAN_IND_1': 
        data.workEducation?.talibanAssociation !== true && data.workEducation?.talibanAssociation !== 'YES',
      
      // === SECURITY AND BACKGROUND: PART 1 PAGE ===
      // Medical/Health Questions - DEFAULT TO NO unless explicitly stated
      'ctl00_SiteContentPlaceHolder_FormView1_rblDisease_0': 
        data.security?.medicalHealth?.hasInfectiousDisease === true || 
        data.security?.medicalHealth?.hasInfectiousDisease === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblDisease_1': 
        data.security?.medicalHealth?.hasInfectiousDisease !== true && 
        data.security?.medicalHealth?.hasInfectiousDisease !== 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblDisorder_0': 
        data.security?.medicalHealth?.hasMentalDisorder === true || 
        data.security?.medicalHealth?.hasMentalDisorder === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblDisorder_1': 
        data.security?.medicalHealth?.hasMentalDisorder !== true && 
        data.security?.medicalHealth?.hasMentalDisorder !== 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblDruguser_0': 
        data.security?.medicalHealth?.hasDrugAbuse === true || 
        data.security?.medicalHealth?.hasDrugAbuse === 'YES',
      'ctl00_SiteContentPlaceHolder_FormView1_rblDruguser_1': 
        data.security?.medicalHealth?.hasDrugAbuse !== true && 
        data.security?.medicalHealth?.hasDrugAbuse !== 'YES',
    };

    // Check direct mapping first
    if (fieldMappings.hasOwnProperty(fieldId)) {
      return fieldMappings[fieldId];
    }
    
    // Check radio mappings
    if (radioMappings.hasOwnProperty(fieldId)) {
      return radioMappings[fieldId];
    }
    
    return null;
  }

  // Parse date string and return month value for DS-160 dropdowns
  getMonthNumber(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    
    console.log(`getMonthNumber called with: ${dateStr}`);
    
    // DS-160 month dropdowns expect the month abbreviation (e.g., "JAN", "FEB", "SEP")
    // NOT the numeric value
    
    // Check for month name format (e.g., "20-SEP-1991")
    const parts = dateStr.toUpperCase().split('-');
    const monthAbbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                                 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    console.log(`Date parts: ${parts.join(', ')}`);
    
    for (const part of parts) {
      if (monthAbbreviations.includes(part)) {
        // Return the month abbreviation directly (e.g., "SEP")
        console.log(`Found month abbreviation: ${part}`);
        return part;
      }
    }
    
    // If numeric format (e.g., "1991-09-20"), convert to abbreviation
    const numericParts = dateStr.split(/[-/]/);
    if (numericParts.length === 3) {
      let monthNum;
      if (numericParts[0].length === 4) {
        // YYYY-MM-DD format
        monthNum = parseInt(numericParts[1]);
      } else if (numericParts[2].length === 4) {
        // DD-MM-YYYY or MM-DD-YYYY
        // Assume MM-DD-YYYY for US format
        monthNum = parseInt(numericParts[0]);
      }
      
      if (monthNum >= 1 && monthNum <= 12) {
        // Return the month abbreviation
        const monthAbbr = monthAbbreviations[monthNum - 1];
        console.log(`Converted numeric month ${monthNum} to ${monthAbbr}`);
        return monthAbbr;
      }
    }
    
    console.log(`Could not parse month from: ${dateStr}`);
    return null;
  }

  // Helper functions
  mapGender(gender) {
    if (!gender) return null;
    
    const genderMap = {
      'M': 'MALE',
      'MALE': 'MALE',
      'F': 'FEMALE',
      'FEMALE': 'FEMALE'
    };
    
    return genderMap[gender.toUpperCase()] || gender;
  }

  mapMaritalStatus(status) {
    if (!status) return null;
    
    const statusMap = {
      'SINGLE': 'S',
      'S': 'S',
      'MARRIED': 'M',
      'M': 'M',
      'DIVORCED': 'D',
      'D': 'D',
      'WIDOWED': 'W',
      'W': 'W',
      'SEPARATED': 'P',
      'P': 'P',
      'LEGAL SEPARATION': 'L',
      'L': 'L',
      'CIVIL UNION': 'C',
      'C': 'C',
      'DOMESTIC PARTNERSHIP': 'O',
      'O': 'O'
    };
    
    return statusMap[status.toUpperCase()] || status;
  }

  mapCountry(country) {
    if (!country) return null;
    
    // Common country mappings for DS-160 dropdown
    const countryMap = {
      'USA': 'USA',
      'UNITED STATES': 'USA',
      'US': 'USA',
      'CHINA': 'CHIN',
      'JAPAN': 'JPN',
      'CANADA': 'CAN',
      'UNITED KINGDOM': 'GBR',
      'UK': 'GBR',
      'GERMANY': 'D',
      'FRANCE': 'F',
      'INDIA': 'IND',
      'SOUTH KOREA': 'KOR',
      'KOREA': 'KOR',
      'MEXICO': 'MEX',
      'BRAZIL': 'BRA',
      'AUSTRALIA': 'AUS',
      'ITALY': 'I',
      'SPAIN': 'E',
      'RUSSIA': 'RUS',
      'PHILIPPINES': 'RP',
      'TAIWAN': 'TW',
      'SINGAPORE': 'SGP',
      'HONG KONG': 'HK',
      'THAILAND': 'T',
      'VIETNAM': 'VN',
      'INDONESIA': 'RI',
      'MALAYSIA': 'MAL'
    };
    
    const upperCountry = country.toUpperCase();
    return countryMap[upperCountry] || country;
  }

  mapPurposeOfTrip(purpose) {
    if (!purpose) return null;
    
    const purposeMap = {
      'BUSINESS/TOURISM': 'B',
      'BUSINESS': 'B',
      'TOURISM': 'B',
      'STUDENT': 'F',
      'WORK': 'H',
      'DIPLOMATIC': 'A',
      'GOVERNMENT': 'A'
    };
    
    return purposeMap[purpose.toUpperCase()] || purpose;
  }

  mapPassportType(type) {
    if (!type) return null;
    
    // Map passport types to DS-160 dropdown values
    const typeMap = {
      'REGULAR': 'R',
      'R': 'R',
      'DIPLOMATIC': 'D',
      'D': 'D',
      'OFFICIAL': 'O',
      'O': 'O',
      'SERVICE': 'S',
      'S': 'S',
      'OTHER': 'OT',
      'OT': 'OT'
    };
    
    return typeMap[type.toUpperCase()] || type;
  }

  // Extract day from date string (DD-MON-YYYY format)
  getDayFromDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    
    // Expected format: "20-SEP-1991" or "1991-09-20"
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        return parts[2].padStart(2, '0');
      } else if (parts[0].length <= 2) {
        // DD-MM-YYYY or DD-MON-YYYY format
        return parts[0].padStart(2, '0');
      }
    }
    return null;
  }

  // Extract year from date string
  getYearFromDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    
    // Expected format: "20-SEP-1991" or "1991-09-20"
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        return parts[0];
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY or DD-MON-YYYY format
        return parts[2];
      }
    }
    return null;
  }

  mapPayerType(payer) {
    if (!payer) return null;
    
    const payerMap = {
      'SELF': 'S',
      'S': 'S',
      'OTHER_PERSON': 'O',
      'O': 'O',
      'PRESENT_EMPLOYER': 'P',
      'P': 'P',
      'EMPLOYER_IN_US': 'U',
      'U': 'U',
      'OTHER_COMPANY': 'C',
      'C': 'C'
    };
    
    return payerMap[payer.toUpperCase()] || payer;
  }

  mapRelationship(relationship) {
    if (!relationship) return null;
    
    // Map common relationships to DS-160 codes
    const relationshipMap = {
      'FRIEND': 'F',
      'F': 'F',
      'RELATIVE': 'R',
      'R': 'R',
      'BUSINESS': 'B',
      'BUSINESS ASSOCIATE': 'B',
      'B': 'B',
      'SCHOOL': 'S',
      'S': 'S',
      'EMPLOYER': 'E',
      'E': 'E',
      'HOTEL': 'H',
      'H': 'H',
      'OTHER': 'O',
      'O': 'O',
      'SELF': 'SELF'
    };
    
    return relationshipMap[relationship.toUpperCase()] || relationship;
  }

  mapOccupation(occupation) {
    if (!occupation) return null;
    
    // Map occupation types to DS-160 codes
    const occupationMap = {
      'STUDENT': 'STUDENT',
      'EMPLOYED': 'EMPLOYED',
      'BUSINESS': 'BUSINESS',
      'COMPUTER_SCIENCE': 'COMPUTER_SCIENCE',
      'COMPUTER SCIENCE': 'COMPUTER_SCIENCE',
      'EDUCATION': 'EDUCATION',
      'ENGINEERING': 'ENGINEERING',
      'GOVERNMENT': 'GOVERNMENT',
      'HOMEMAKER': 'HOMEMAKER',
      'MEDICAL': 'MEDICAL',
      'MILITARY': 'MILITARY',
      'NATURAL_SCIENCES': 'NATURAL_SCIENCES',
      'NATURAL SCIENCES': 'NATURAL_SCIENCES',
      'NOT_EMPLOYED': 'NOT_EMPLOYED',
      'NOT EMPLOYED': 'NOT_EMPLOYED',
      'UNEMPLOYED': 'NOT_EMPLOYED',
      'RETIRED': 'RETIRED',
      'AGRICULTURE': 'AGRICULTURE',
      'ARTIST': 'ARTIST',
      'COMMUNICATIONS': 'COMMUNICATIONS',
      'FINANCE': 'FINANCE',
      'LEGAL': 'LEGAL',
      'RESEARCH': 'RESEARCH',
      'RELIGIOUS': 'RELIGIOUS',
      'SOCIAL_SCIENCES': 'SOCIAL_SCIENCES',
      'SOCIAL SCIENCES': 'SOCIAL_SCIENCES',
      'OTHER': 'OTHER'
    };
    
    return occupationMap[occupation.toUpperCase()] || occupation;
  }

  mapStayUnit(unit) {
    if (!unit) return null;
    
    const unitMap = {
      'DAYS': 'D',
      'DAY': 'D',
      'D': 'D',
      'WEEKS': 'W',
      'WEEK': 'W',
      'W': 'W',
      'MONTHS': 'M',
      'MONTH': 'M',
      'M': 'M',
      'YEARS': 'Y',
      'YEAR': 'Y',
      'Y': 'Y'
    };
    
    return unitMap[unit.toUpperCase()] || unit;
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle format like "20-SEP-1991"
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthMap = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      
      let day, month, year;
      
      // Check if middle part is a month name
      if (monthMap[parts[1]]) {
        day = parts[0].padStart(2, '0');
        month = monthMap[parts[1]];
        year = parts[2];
      } else if (parts[0].length === 4) {
        // YYYY-MM-DD format
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else {
        // DD-MM-YYYY format
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      }
      
      return { year, month, day };
    }
    
    return null;
  }

  // Main fill function with two passes
  async fillWithTwoPasses(data) {
    this.currentData = data;
    this.filledFields.clear();
    
    const page = this.detectCurrentPage();
    console.log(`Current page detected: ${page}`);
    
    // Special handling for Personal Page 2
    if (page === 'personal2') {
      console.log('Detected Personal Information Page 2 - will focus on nationality, IDs, and SSN fields');
    }
    
    let totalFilled = 0;
    
    for (let pass = 1; pass <= CONFIG.maxPasses; pass++) {
      console.log(`\n=== Pass ${pass} ===`);
      
      const visibleFields = this.getVisibleFields();
      console.log(`Found ${visibleFields.length} visible unfilled fields`);
      
      if (visibleFields.length === 0) {
        console.log('No more fields to fill');
        break;
      }
      
      let filledInThisPass = 0;
      
      for (const field of visibleFields) {
        const filled = this.fillField(field, data);
        if (filled) {
          filledInThisPass++;
          totalFilled++;
          await this.delay(CONFIG.fillDelay);
        }
      }
      
      console.log(`Filled ${filledInThisPass} fields in pass ${pass}`);
      
      if (pass < CONFIG.maxPasses && filledInThisPass > 0) {
        console.log(`Waiting ${CONFIG.passDelay}ms for dynamic fields to appear...`);
        await this.delay(CONFIG.passDelay);
      }
      
      if (filledInThisPass === 0) {
        console.log('No fields filled in this pass, stopping');
        break;
      }
    }
    
    console.log(`\n=== Complete ===`);
    console.log(`Total fields filled: ${totalFilled}`);
    
    return totalFilled;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main extension controller
class DS160Extension {
  constructor() {
    this.filler = new TwoPassFiller();
    this.data = null;
    this.init();
  }

  init() {
    if (window.location.hostname !== 'ceac.state.gov') {
      console.log('Not on CEAC website');
      return;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fillForm' && request.data) {
        console.log('Received fill request');
        this.data = request.data;
        this.startFilling().then(result => {
          sendResponse({ success: true, filledCount: result });
        });
        return true;
      }
    });

    chrome.runtime.sendMessage({ action: 'getStoredData' }, (response) => {
      if (response && response.data) {
        console.log('Found stored data');
        this.data = response.data;
        this.addFloatingButton();
      }
    });
  }

  addFloatingButton() {
    const existing = document.getElementById('ds160-autofill-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'ds160-autofill-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
    `;
    
    const button = document.createElement('button');
    button.textContent = '🚀 Auto-Fill (All Pages Fixed)';
    button.style.cssText = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      width: 100%;
      margin-bottom: 10px;
    `;
    
    const status = document.createElement('div');
    status.id = 'fill-status';
    status.style.cssText = `
      font-size: 12px;
      color: #666;
      text-align: center;
    `;
    
    const pageInfo = document.createElement('div');
    pageInfo.style.cssText = `
      font-size: 11px;
      color: #999;
      text-align: center;
      margin-top: 5px;
    `;
    const currentPage = this.filler.detectCurrentPage();
    pageInfo.textContent = `Page: ${currentPage}`;
    
    button.addEventListener('click', () => {
      button.disabled = true;
      status.textContent = 'Filling...';
      status.style.color = '#ff9800';
      
      this.startFilling().then(count => {
        button.disabled = false;
        status.textContent = `✓ Filled ${count} fields`;
        status.style.color = '#4caf50';
        
        setTimeout(() => {
          status.textContent = '';
        }, 3000);
      });
    });
    
    container.appendChild(button);
    container.appendChild(status);
    container.appendChild(pageInfo);
    document.body.appendChild(container);
  }

  async startFilling() {
    if (!this.data) {
      console.error('No data available');
      return 0;
    }
    
    console.log('Starting two-pass fill process...');
    const count = await this.filler.fillWithTwoPasses(this.data);
    console.log('Fill process complete');
    return count;
  }
}

// Initialize the extension
const extension = new DS160Extension();
console.log('DS-160 Two-Pass Auto-Filler (Complete Field Support) initialized');