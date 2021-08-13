const storage = document.querySelector("#storage");
const download = document.querySelector("#download");
const deleteDb = document.querySelector("#delete");
const confirmation = document.querySelector("#confirmation");

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
  const popup = {
    width: storageValue(width),
    height: storageValue(height),
    zoomIn: storageValue(zoomIn),
    zoomOut: storageValue(zoomOut),
  };

  chrome.storage.sync.set({ popup }, function () {
    confirmation.innerText = "Changes sucessfully updated";
  });
});

function storageValue(element) {
  if (element.value) {
    return element.value;
  } else {
    return element.placeholder;
  }
}

// Download all notes
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
const deleteConfirm = document.querySelector("#delete-confirm");
const accept = document.querySelector("#accept");
const abort = document.querySelector("#abort");

accept.addEventListener("click", function () {
  chrome.runtime.sendMessage("clear-database", function (response) {
    confirmation.style.display = "block";
    confirmation.style.visibility = "visible";
    confirmation.innerText = "Notes deleted";

    deleteConfirm.style.display = "none";
    deleteConfirm.style.visibility = "hidden";
  });
});

abort.addEventListener("click", function () {
  deleteConfirm.style.display = "none";
  deleteConfirm.style.visibility = "hidden";
});

deleteDb.addEventListener("click", function () {
  deleteConfirm.style.display = "block";
  deleteConfirm.style.visibility = "visible";
});
