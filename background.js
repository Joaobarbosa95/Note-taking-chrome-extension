/**
 * Save popup config on installation, database and context menu creation
 */
chrome.runtime.onInstalled.addListener(() => {
  const popup = {
    width: 300,
    height: 500,
    zoomIn: 10,
    zoomOut: 10,
    save: function () {
      chrome.storage.sync.set({ popup: this });
      console.log("Extension window dimensions saved");
    },
  };

  popup.save();

  // Open database
  const DBOpenRequest = indexedDB.open("Notes", 1);
  DBOpenRequest.onerror = function (event) {
    console.log("Error loading database");
  };

  DBOpenRequest.onsuccess = function (event) {
    console.log("Database initialised");
  };

  DBOpenRequest.onupgradeneeded = function (event) {
    let db = event.target.result;

    db.onerror = function (event) {
      console.log("Error loading database");
    };

    db.createObjectStore("Notes", { keyPath: "id" });
  };

  // Add context menu
  chrome.contextMenus.create({
    id: "add",
    title: "Insert selected text into note",
    contexts: ["page", "selection", "link"],
  });
});

/**
 * When extension is oppened
 */

let cachedNotes;

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Send database and set cache
  if (message === "get-database") {
    // If no cached notes exist, query database
    if (!cachedNotes) {
      openDB("readonly").then((objectStore) => {
        if (!objectStore) return;

        objectStore.getAll().onsuccess = function (event) {
          cachedNotes = event.target.result;
          sendResponse({
            ["database"]: event.target.result,
          });
        };
      });
    } else {
      sendResponse({
        ["database"]: cachedNotes,
      });
    }
    return true;
  }

  // New note message passing
  if (message.note) {
    openDB("readwrite").then((objectStore) => {
      if (!objectStore) return;

      objectStore.add(message.note);

      if (cachedNotes) {
        cachedNotes.push(message.note);
      }

      sendResponse({});
    });
    return true;
  }

  // Edit message passing
  if (message.edit) {
    openDB("readwrite").then((objectStore) => {
      if (!objectStore) return;

      const request = objectStore.get(message.edit.id);

      request.onerror = function () {
        console.log("Impossible to update database");
      };

      request.onsuccess = function (event) {
        const note = event.target.result;
        if (message.edit.text) note.text = message.edit.text;
        if (message.edit.bookmark || message.edit.bookmark === false)
          note.bookmarked = message.edit.bookmark;

        const updateRequest = objectStore.put(note);

        updateRequest.onerror = function () {
          console.log("Impossible to update database");
        };

        updateRequest.onsuccess = function () {
          console.log("Note updated successfully");
        };
      };
    });

    if (cachedNotes) {
      const index = cachedNotes.findIndex(
        (note) => note.id === message.edit.id
      );

      if (message.edit.text) cachedNotes[index].text = message.edit.text;
      if (message.edit.bookmark || message.edit.bookmark === false)
        cachedNotes[index].bookmarked = message.edit.bookmark;
    }

    sendResponse({});
    return true;
  }

  if (message.delete) {
    openDB("readwrite").then((objectStore) => {
      if (!objectStore) return;
      const request = objectStore.delete(message.delete.id);

      request.onerror = function () {
        console.log("Impossible to update database");
      };

      request.onsuccess = function (event) {
        console.log("Note deleted from database");
      };
    });

    if (cachedNotes) {
      const index = cachedNotes.findIndex(
        (note) => note.id === message.delete.id
      );
      cachedNotes.splice(index, 1);
    }

    sendResponse({});
    return true;
  }

  if (message == "clear-database") {
    openDB("readwrite").then((objectStore) => {
      if (!objectStore) return;
      const request = objectStore.clear();

      request.onerror = function () {
        console.log("Impossible to delete database");
      };

      request.onsuccess = function (event) {
        console.log("Notes deleted from database");
      };
    });

    if (cachedNotes) cachedNotes = [];

    sendResponse({});
    return true;
  }
});

/**
 * Context Menu
 */

chrome.contextMenus.onClicked.addListener(function (info) {
  if (!info.selectionText || info.selectionText.trim() == "") return;

  const url = new URL(info.pageUrl);

  const noteObj = {
    id: new Date().getTime(),
    text: info.selectionText,
    bookmarked: false,
    hostname: url.hostname,
    href: url.href,
  };

  openDB("readwrite").then((objectStore) => {
    if (!objectStore) return;

    objectStore.add(noteObj);

    if (cachedNotes) {
      cachedNotes.push(noteObj);
    }
  });
});

function openDB(mode) {
  return new Promise((resolve, reject) => {
    let db = indexedDB.open(["Notes"]);

    db.onsuccess = function (event) {
      db = event.target.result;
      const transaction = db.transaction(["Notes"], `${mode}`);
      resolve(transaction.objectStore("Notes"));
    };

    db.onerror = function (event) {
      console.log("Impossible to connect to database");
      reject();
    };
  });
}
