require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const ROOT_FOLDER_ID = process.env.CUSNOTES_ROOT_FOLDER_ID;
const OUTPUT_FILE = path.join(__dirname, '../notes.json');

// Initialize Drive API
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:5500'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Helper to delay execution (avoid rate limits)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to normalize titles
function normalizeTitle(filename) {
  // Remove file extension
  let title = filename.replace(/\.[^/.]+$/, "");
  // Remove "Notes - " prefix if present (case insensitive)
  title = title.replace(/^notes\s*-\s*/i, "");
  return title.trim();
}

// Helper to determine file type
function getFileType(mimeType, filename) {
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder';
  if (mimeType === 'application/pdf') return 'pdf';
  if (filename.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'link'; // Default to link for other types or Drive files
}

// Helper to map folder names to JSON keys
function mapSemester(folderName) {
  const lowerName = folderName.toLowerCase().trim();
  
  // 1. Check for explicit "Sem X" or "X Sem" patterns with digits
  // Matches: "Sem 1", "Semester 1", "1st Sem", "Sem-1", "1 Sem"
  const semRegex = /sem(?:ester)?[\s-]*(\d+)|(\d+)(?:th|nd|rd|st|ist)?[\s-]*sem(?:ester)?/i;
  const match = lowerName.match(semRegex);
  if (match) {
    const num = match[1] || match[2];
    return `Sem-${num}`;
  }

  // 2. Check for word-based numbers (first, second, etc.)
  const wordMap = {
    'first': '1', 'ist': '1', '1st': '1',
    'second': '2', '2nd': '2',
    'third': '3', '3rd': '3',
    'fourth': '4', '4th': '4',
    'fifth': '5', '5th': '5',
    'sixth': '6', '6th': '6'
  };

  for (const [word, num] of Object.entries(wordMap)) {
    // Case A: The folder name IS exactly the word (e.g. "1st", "First")
    if (lowerName === word) return `Sem-${num}`;
    
    // Case B: The folder name contains the word AND "sem" (e.g. "First Semester", "Sem First")
    // This prevents "History of 1st World War" from being detected as Sem-1
    if (lowerName.includes(word) && lowerName.includes('sem')) {
      return `Sem-${num}`;
    }
  }
  
  return null;
}

async function listFiles(folderId) {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
      pageSize: 1000,
    });
    return res.data.files;
  } catch (error) {
    console.error(`Error listing files for folder ${folderId}:`, error.message);
    return [];
  }
}

// Configuration for subject semester limits
// If a subject is not listed here, it defaults to all 6 semesters.
const SUBJECT_SEMESTER_CONFIG = {
  "EVS - VAC": ["Sem-1", "Sem-2", "Sem-3"],
  "IT - DTS": ["Sem-1", "Sem-2", "Sem-3"],
  "English - Communication skills": ["Sem-1", "Sem-2", "Sem-3"],
  "English - English laungage": ["Sem-1", "Sem-2", "Sem-3"],
  "English - Essentials of communication": ["Sem-1", "Sem-2", "Sem-3"],
  "History - Understanding India": ["Sem-1", "Sem-2"],
  "Earth science - Water management": ["Sem-1", "Sem-2", "Sem-3"],
  "Earth science - Geography": ["Sem-1", "Sem-2", "Sem-3", "Sem-4", "Sem-5", "Sem-6"]
};

// Recursive function to process a subject folder
async function processSubjectFolder(folderId, subjectName, notesData) {
  console.log(`Processing Subject: ${subjectName}`);
  
  // Initialize subject if not exists
  if (!notesData.subjects[subjectName]) {
    const validSemesters = SUBJECT_SEMESTER_CONFIG[subjectName] || 
      ["Sem-1", "Sem-2", "Sem-3", "Sem-4", "Sem-5", "Sem-6"];
      
    notesData.subjects[subjectName] = {};
    validSemesters.forEach(sem => {
      notesData.subjects[subjectName][sem] = [];
    });
  }

  const items = await listFiles(folderId);
  
  for (const item of items) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      const semKey = mapSemester(item.name);
      
      if (semKey) {
        // It's a semester folder
        console.log(`  Processing ${semKey} for ${subjectName}...`);
        const notes = await listFiles(item.id);
        
        const processedNotes = notes.map(file => ({
          title: normalizeTitle(file.name),
          url: file.webViewLink,
          type: getFileType(file.mimeType, file.name),
          lastUpdated: file.modifiedTime.split('T')[0]
        }));

        // Merge with existing notes if any (though usually empty at start)
        if (!notesData.subjects[subjectName][semKey]) {
             notesData.subjects[subjectName][semKey] = [];
        }
        notesData.subjects[subjectName][semKey].push(...processedNotes);
        
      } else {
        // It's a subdivision folder (e.g., "Major", "Minor")
        // Treat it as a new "Subject" in the JSON, e.g., "Biochemistry - Major"
        const subSubjectName = `${subjectName} - ${item.name.trim()}`;
        console.log(`  Found subdivision: ${subSubjectName}`);
        await processSubjectFolder(item.id, subSubjectName, notesData);
      }
      
      await delay(100);
    } else {
      // It's a file directly in the subject/subdivision folder
      // Try to detect semester from filename
      const semKey = mapSemester(item.name);
      
      if (semKey) {
        console.log(`  Found file for ${semKey} in ${subjectName}: ${item.name}`);
        
        const note = {
          title: normalizeTitle(item.name),
          url: item.webViewLink,
          type: getFileType(item.mimeType, item.name),
          lastUpdated: item.modifiedTime.split('T')[0]
        };

        if (!notesData.subjects[subjectName][semKey]) {
             notesData.subjects[subjectName][semKey] = [];
        }
        notesData.subjects[subjectName][semKey].push(note);
      }
    }
  }
}

async function generateNotes() {
  console.log('Starting Drive Sync...');
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !ROOT_FOLDER_ID) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  const notesData = {
    subjects: {}
  };

  // 1. Get Subjects (Folders in Root)
  const subjects = await listFiles(ROOT_FOLDER_ID);
  
  for (const subjectFolder of subjects) {
    if (subjectFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
    
    const subjectName = subjectFolder.name.trim();
    
    // Ignore specific folders
    if (['Pending', 'Rejected', 'Templates'].includes(subjectName)) continue;

    await processSubjectFolder(subjectFolder.id, subjectName, notesData);
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notesData, null, 2));
  console.log(`Successfully generated notes.json at ${OUTPUT_FILE}`);
}

generateNotes().catch(console.error);
