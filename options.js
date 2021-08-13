// Options page
// Change the start heigth and width -> precise box size people want
// Also change the px number when you zoom in and out
// Button to download all notes

// Get all notes
function getAllNotes() {
  // Pass null to storage to get all results
  return chrome.storage.sync.get();
}

// Clear all notes
async function clearAllNotes() {
  chrome.storage.sync.clear();
}
