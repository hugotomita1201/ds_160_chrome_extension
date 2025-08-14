# Test with Real Data

## Instructions
1. First, save your actual data that's causing the crash
2. Add the test mode flags to it
3. Try different combinations

## Test A: Real Data, Skip Dropdowns and Radio
Take your actual JSON data and add these lines at the top:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["ddl", "DropDownList", "rbl"],
  ... rest of your actual data ...
}
```

## Test B: Real Data, Only Fill First Few Fields
```json
{
  "_testMode": true,
  "_fieldsToFill": ["tbEmployerName", "tbEmployerStreetAddress1", "tbEmployerCity"],
  ... rest of your actual data ...
}
```

## Test C: Real Data, Skip Specific Problem Fields
Try skipping fields one by one to find the problematic one:

### Skip employer name only:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["tbEmployerName"],
  ... rest of your actual data ...
}
```

### Skip addresses only:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["Address"],
  ... rest of your actual data ...
}
```

### Skip supervisor fields:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["Supervisor"],
  ... rest of your actual data ...
}
```

### Skip duties field:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["Duties", "tbDescribe"],
  ... rest of your actual data ...
}
```

### Skip state/province fields:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["STATE", "PROVINCE"],
  ... rest of your actual data ...
}
```

### Skip postal code:
```json
{
  "_testMode": true,
  "_fieldsToSkip": ["POSTAL"],
  ... rest of your actual data ...
}
```

## Test D: Check for Special Characters
If your data has any of these, it might cause issues:
- Apostrophes (')
- Quotes (")
- Ampersands (&)
- Slashes (/)
- Parentheses ()
- Special unicode characters

Try replacing problematic text with simple text:
```json
{
  "_testMode": true,
  "workEducation": {
    "previousEmployers": [{
      "employerName": "Simple Test Company",
      "employerStreetAddress1": "123 Main Street",
      "employerCity": "Boston",
      "supervisorSurname": "Smith",
      "supervisorGivenName": "John",
      "describeDuties": "Simple duties without special characters"
    }]
  }
}
```

## Questions to Consider:
1. Does the person have an unusually long employer name?
2. Are there any special characters in their data?
3. Do they have multiple previous employers (array with multiple entries)?
4. Is there any field that's empty or null that shouldn't be?
5. Are the dates in an unusual format?