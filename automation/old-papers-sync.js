require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const PAPERS_FOLDER_ID = '1cN6Vo1aqkSmlT8w-_pbwoyGk6SpJrPFj';
const OUTPUT_FILE = path.join(__dirname, '../old-papers.json');

// Initialize Drive API
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:5500'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function listFiles(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      pageSize: 1000,
    });
    return res.data.files;
  } catch (error) {
    console.error(`Error listing files for folder ${folderId}:`, error.message);
    return [];
  }
}

function parseFilename(filename) {
  // Clean filename: remove extension if present
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Pattern 1: Subject_Semester_Year (e.g., Biochemistry_2nd_2024, Biochemistry_2ndsem_2024)
  // Supports 'sem', 'Sem', 'semester' suffix for semester number
  const regex1 = /^([a-zA-Z0-9\s&()-]+)_(\d+)(?:st|nd|rd|th)?(?:sem|semester)?_(\d{4})/i;
  
  // Pattern 2: Subject_Year_Semester (e.g., Health&Wellness_2024_1stSem)
  const regex2 = /^([a-zA-Z0-9\s&()-]+)_(\d{4})_(\d+)(?:st|nd|rd|th)?(?:sem|semester)?/i;

  let match = nameWithoutExt.match(regex1);
  if (match) {
    return {
      subject: match[1].trim(),
      semester: parseInt(match[2]),
      year: match[3]
    };
  }

  match = nameWithoutExt.match(regex2);
  if (match) {
    return {
      subject: match[1].trim(),
      semester: parseInt(match[3]), // Semester is group 3 here
      year: match[2]              // Year is group 2 here
    };
  }

  return null;
}

async function syncPapers() {
  console.log('Starting Old Papers Sync...');
  
  const files = await listFiles(PAPERS_FOLDER_ID);
  console.log(`Found ${files.length} files in the folder.`);

  const papersData = {};

  for (const file of files) {
    // Skip folders
    if (file.mimeType === 'application/vnd.google-apps.folder') continue;

    const parsed = parseFilename(file.name);
    
    if (parsed) {
      const { subject, semester, year } = parsed;

      if (!papersData[subject]) {
        papersData[subject] = {};
      }
      // Use simple number for semester key to help with sorting
      if (!papersData[subject][semester]) {
        papersData[subject][semester] = [];
      }

      papersData[subject][semester].push({
        year: year,
        link: file.webViewLink,
        name: file.name
      });
    } else {
      console.log(`Skipping file (invalid format): ${file.name}`);
    }
  }

  // Sort papers by year (descending) within each semester
  for (const subject in papersData) {
    for (const semester in papersData[subject]) {
      papersData[subject][semester].sort((a, b) => b.year - a.year);
    }
  }

  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(papersData, null, 2));
  console.log(`Successfully wrote ${Object.keys(papersData).length} subjects to ${OUTPUT_FILE}`);
}

syncPapers().catch(console.error);
