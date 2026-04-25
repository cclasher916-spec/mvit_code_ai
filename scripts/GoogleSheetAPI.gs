/**
 * MVIT Coding Team - Onboarding Sheet API
 * 
 * 1. Open your Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete existing code, paste this in.
 * 4. Click Deploy -> New Deployment.
 * 5. Type: Web App. Execute as: "Me". Who has access: "Anyone".
 * 6. Copy the Web App URL and provide it to the React frontend.
 */

var SHEET_NAME = 'Sheet1'; // Make sure this matches your tab name!

function setupHeaders() {
  var sheet = SpreadsheetApp.openById('1M3wYZsT-4hDNbHuaaXnKx-_V8Cdk7z799EWOapZFqgQ').getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.openById('1M3wYZsT-4hDNbHuaaXnKx-_V8Cdk7z799EWOapZFqgQ').insertSheet(SHEET_NAME);
  }
  
  // These headers strictly match bulk_onboard.py
  var headers = [
    'Timestamp',
    'Full Name',
    'Roll Number',
    'Student Email Address',
    'Mobile Number',
    'Batch',
    'Department',
    'Section',
    'Team Name (Optional)',
    'Team Role (Optional)',
    'LeetCode Username',
    'GitHub Username (Optional)',
    'CodeChef Username (Optional)',
    'Codeforces Username (Optional)',
    'HackerRank Username (Optional)',
    'SkillRack Username (Optional)'
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById('1M3wYZsT-4hDNbHuaaXnKx-_V8Cdk7z799EWOapZFqgQ').getSheetByName(SHEET_NAME);
    if (!sheet) return responseJson({success: false, error: 'Sheet not found'});
    
    var data = JSON.parse(e.postData.contents);
    var rollNo = String(data['roll_number']).trim().toUpperCase();
    
    if (!rollNo) return responseJson({success: false, error: 'Roll number is required'});
    
    // Find if student already exists (to overwrite)
    var dataRange = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Assuming Roll Number is the 3rd column (index 2)
    for (var i = 1; i < dataRange.length; i++) {
      if (String(dataRange[i][2]).trim().toUpperCase() === rollNo) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }
    
    var rowData = [
      new Date().toISOString(),
      data['full_name'] || '',
      rollNo,
      data['student_email_address'] || '',
      data['mobile_number'] || '',
      data['batch'] || '',
      data['department'] || '',
      data['section'] || '',
      data['team_name'] || '',
      data['team_role'] || 'member',
      data['leetcode_username'] || '',
      data['github_username'] || '',
      data['codechef_username'] || '',
      data['codeforces_username'] || '',
      data['hackerrank_username'] || '',
      data['skillrack_username'] || ''
    ];
    
    if (rowIndex > -1) {
      // Overwrite
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      return responseJson({success: true, message: 'Updated existing record'});
    } else {
      // Append new
      sheet.appendRow(rowData);
      return responseJson({success: true, message: 'Created new record'});
    }
    
  } catch (err) {
    return responseJson({success: false, error: err.toString()});
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.openById('1M3wYZsT-4hDNbHuaaXnKx-_V8Cdk7z799EWOapZFqgQ').getSheetByName(SHEET_NAME);
    if (!sheet) return responseJson({success: false, error: 'Sheet not found'});
    
    var rollNo = e.parameter.roll_no;
    var email = e.parameter.email;
    
    if (!rollNo || !email) {
      return responseJson({success: false, error: 'Missing roll_no or email parameter'});
    }
    
    rollNo = String(rollNo).trim().toUpperCase();
    email = String(email).trim().toLowerCase();
    
    var dataRange = sheet.getDataRange().getValues();
    var headers = dataRange[0];
    
    for (var i = 1; i < dataRange.length; i++) {
      var sheetRoll = String(dataRange[i][2]).trim().toUpperCase();
      var sheetEmail = String(dataRange[i][3]).trim().toLowerCase(); // Index 3 is email
      
      if (sheetRoll === rollNo && sheetEmail === email) {
        // Found user! Package the data.
        var user = {};
        user['full_name'] = dataRange[i][1];
        user['roll_number'] = dataRange[i][2];
        user['student_email_address'] = dataRange[i][3];
        user['mobile_number'] = dataRange[i][4];
        user['batch'] = dataRange[i][5];
        user['department'] = dataRange[i][6];
        user['section'] = dataRange[i][7];
        user['team_name'] = dataRange[i][8];
        user['team_role'] = dataRange[i][9];
        user['leetcode_username'] = dataRange[i][10];
        user['github_username'] = dataRange[i][11];
        user['codechef_username'] = dataRange[i][12];
        user['codeforces_username'] = dataRange[i][13];
        user['hackerrank_username'] = dataRange[i][14];
        user['skillrack_username'] = dataRange[i][15];
        
        return responseJson({success: true, data: user});
      }
    }
    
    return responseJson({success: false, error: 'Credentials not found'});
    
  } catch (err) {
    return responseJson({success: false, error: err.toString()});
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Enable CORS for OPTIONS preflight requests
function doOptions(e) {
  return responseJson({});
}
