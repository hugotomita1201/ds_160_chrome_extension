# DS-160 Test Scenarios for Previous Work Page

## How to Use

1. Copy one of the test JSON objects below
2. Paste it into the extension popup
3. Click "Auto-fill Form"
4. See which fields get filled and whether it crashes

## Test 1: Only Text Fields (No Dropdowns)
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["ddl", "DropDownList", "rbl"],
  "workEducation": {
    "previousEmployers": [{
      "employerName": "Test Company Inc",
      "employerStreetAddress1": "123 Test Street",
      "employerStreetAddress2": "Suite 100",
      "employerCity": "Test City",
      "employerState": "CA",
      "employerPostalCode": "12345",
      "employerCountry": "USA",
      "employerPhone": "555-1234",
      "jobTitle": "Test Engineer",
      "supervisorSurname": "Smith",
      "supervisorGivenName": "John",
      "empDateFromDay": "01",
      "empDateFromMonth": "01",
      "empDateFromYear": "2020",
      "empDateToDay": "31",
      "empDateToMonth": "12",
      "empDateToYear": "2022",
      "describeDuties": "Testing software applications"
    }],
    "previousEducation": []
  }
}
```

## Test 2: Only Dropdowns (No Text Fields)
```json
{
  "_testMode": true,
  "_fieldsToFill": ["ddl", "DropDownList"],
  "workEducation": {
    "previousEmployers": [{
      "employerCountry": "USA",
      "empDateFromDay": "01",
      "empDateFromMonth": "01",
      "empDateToDay": "31",
      "empDateToMonth": "12"
    }],
    "previousEducation": []
  }
}
```

## Test 3: Only Basic Info (Name, Address, Phone)
```json
{
  "_testMode": true,
  "_fieldsToFill": ["EmployerName", "Street", "City", "Phone"],
  "workEducation": {
    "previousEmployers": [{
      "employerName": "Test Company Inc",
      "employerStreetAddress1": "123 Test Street",
      "employerStreetAddress2": "Suite 100",
      "employerCity": "Test City",
      "employerPhone": "555-1234"
    }],
    "previousEducation": []
  }
}
```

## Test 4: Only Dates
```json
{
  "_testMode": true,
  "_fieldsToFill": ["DateFrom", "DateTo", "Year"],
  "workEducation": {
    "previousEmployers": [{
      "empDateFromDay": "01",
      "empDateFromMonth": "01",
      "empDateFromYear": "2020",
      "empDateToDay": "31",
      "empDateToMonth": "12",
      "empDateToYear": "2022"
    }],
    "previousEducation": []
  }
}
```

## Test 5: Only Country Dropdown
```json
{
  "_testMode": true,
  "_fieldsToFill": ["Country", "DropDownList2"],
  "workEducation": {
    "previousEmployers": [{
      "employerCountry": "USA"
    }],
    "previousEducation": []
  }
}
```

## Test 6: Everything Except Country
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["Country", "DropDownList2"],
  "workEducation": {
    "previousEmployers": [{
      "employerName": "Test Company Inc",
      "employerStreetAddress1": "123 Test Street",
      "employerCity": "Test City",
      "employerState": "CA",
      "employerPostalCode": "12345",
      "employerPhone": "555-1234",
      "jobTitle": "Test Engineer",
      "supervisorSurname": "Smith",
      "supervisorGivenName": "John",
      "empDateFromDay": "01",
      "empDateFromMonth": "01",
      "empDateFromYear": "2020",
      "empDateToDay": "31",
      "empDateToMonth": "12",
      "empDateToYear": "2022",
      "describeDuties": "Testing software applications"
    }],
    "previousEducation": []
  }
}
```

## Test 7: Only Supervisor Fields
```json
{
  "_testMode": true,
  "_fieldsToFill": ["Supervisor"],
  "workEducation": {
    "previousEmployers": [{
      "supervisorSurname": "Smith",
      "supervisorGivenName": "John"
    }],
    "previousEducation": []
  }
}
```

## Test 8: Only Duties Field
```json
{
  "_testMode": true,
  "_fieldsToFill": ["Duties"],
  "workEducation": {
    "previousEmployers": [{
      "describeDuties": "Testing software applications and debugging code"
    }],
    "previousEducation": []
  }
}
```

## Test 9: State and Postal Code Only
```json
{
  "_testMode": true,
  "_fieldsToFill": ["State", "Postal"],
  "workEducation": {
    "previousEmployers": [{
      "employerState": "CA",
      "employerPostalCode": "12345"
    }],
    "previousEducation": []
  }
}
```

## Field Identification Reference

Based on the screenshot, here are the field patterns:
- Employer Name: `tbEmployerName`
- Street Address: `tbEmployerStreetAddress1`, `tbEmployerStreetAddress2`
- City: `tbEmployerCity`
- State: `tbxPREV_EMPL_ADDR_STATE`
- Postal Code: `tbxPREV_EMPL_ADDR_POSTAL_CD`
- Country: `DropDownList2`
- Phone: `tbEmployerPhone`
- Job Title: `tbJobTitle`
- Supervisor Surname: `tbSupervisorSurname`
- Supervisor Given Name: `tbSupervisorGivenName`
- Date dropdowns: `ddlEmpDateFromDay`, `ddlEmpDateFromMonth`, etc.
- Year fields: `tbxEmpDateFromYear`, `tbxEmpDateToYear`
- Duties: `tbDescribeDuties`

## Testing Strategy

1. Start with Test 1 (only text fields) - if this works, the issue is with dropdowns
2. Try Test 2 (only dropdowns) - if this crashes, we know dropdowns are the issue
3. Use Test 5 (only country) - country dropdowns often cause postbacks
4. Use Test 4 (only dates) - date fields might have validation
5. Try combinations to narrow down the exact problematic field

## Notes

- The `_testMode` flag enables selective field filling
- `_fieldsToFill` array: Only fields containing these patterns will be filled
- `_fieldsToSkip` array: Fields containing these patterns will be skipped
- You can combine both for precise control