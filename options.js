// Options page
// Change the start heigth and width -> precise box size people want
// Also change the px number when you zoom in and out
// Button to download all notes

const storage = document.querySelector("#storage");
const download = document.querySelector("#download");
const deleteDb = document.querySelector("#delete");

const width = storage.elements.namedItem("width");
const height = storage.elements.namedItem("height");
const zoomIn = storage.elements.namedItem("zoom-in");
const zoomOut = storage.elements.namedItem("zoom-out");

// Get storage values and set them as placeholders
chrome.storage.sync.get("popup", function ({ popup }) {
  width.placeholder = popup.width;
  height.placeholder = popup.height;
  zoomIn.placeholder = popup.zoomIn;
  zoomOut.placeholder = popup.zoomOut;
});

storage.addEventListener("submit", function (e) {
  e.preventDefault();
  const popup = {
    width: storageValue(width),
    height: storageValue(height),
    zoomIn: storageValue(zoomIn),
    zoomOut: storageValue(zoomOut),
  };

  chrome.storage.sync.set({ popup }, function () {
    // Add some visual confirmation
  });
});

function storageValue(element) {
  if (element.value) {
    return element.value;
  } else {
    return element.placeholder;
  }
}

// Get all notes
download.addEventListener("click", function () {
  chrome.runtime.sendMessage("get-database", function (response) {
    const db = response.database;
    const json = JSON.stringify(db);
    const blob = new Blob([json], {
      type: "text/plain;charset=utf-8",
    });
    const link = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "Papyrus_All_Notes.txt";
    a.href = link;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

// Clear all notes
async function clearAllNotes() {
  deleteDb.addEventListener("click", function () {
    // Add confirmation/abortion buttons before deletion
    chrome.runtime.sendMessage("clear-database", function (response) {
      console.log("database clear");
      // add visual confirmation
    });
  });
}
