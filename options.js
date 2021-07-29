// Get all notes
function getAllNotes() {
  // Pass null to storage to get all results
  return chrome.storage.sync.get();
}

// Clear all notes
async function clearAllNotes() {
  chrome.storage.sync.clear();
}
