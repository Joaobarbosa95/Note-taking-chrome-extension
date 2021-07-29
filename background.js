/**
 * Save popup config on installation
 */
chrome.runtime.onInstalled.addListener(() => {
  const popup = {
    width: 300,
    height: 500,
    save: function () {
      chrome.storage.sync.set({ popup: this });
      console.log("Extension window dimensions saved");
    },
  };

  popup.save();

  // Open a database
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
    const objectStore = db.createObjectStore("Notes", { keyPath: "id" });
  };
});

let cachedNotes;
// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Send database and set cache
  if (message === "get-database") {
    if (!cachedNotes) {
      let db = indexedDB.open(["Notes"]);

      db.onsuccess = function (event) {
        db = event.target.result;
        const transaction = db.transaction(["Notes"], "readonly");
        const objectStore = transaction.objectStore("Notes");
        objectStore.getAll().onsuccess = function (event) {
          cachedNotes = event.target.result;
          sendResponse({
            ["database"]: event.target.result,
          });
        };
      };

      db.onerror = function (event) {
        console.log("Impossible to connect to database");
      };
    } else {
      sendResponse({
        ["database"]: cachedNotes,
      });
    }
    return true;
  }

  // New note message passing
  if (message.note) {
    let db = indexedDB.open(["Notes"]);
    db.onsuccess = function (event) {
      db = event.target.result;
      const transaction = db.transaction(["Notes"], "readwrite");
      const objectStore = transaction.objectStore("Notes");
      objectStore.add(message.note);
    };

    db.onerror = function (event) {
      console.log("Impossible to save note to database");
    };

    if (cachedNotes) {
      cachedNotes.push(message.note);
    }

    sendResponse({});
    return true;
  }

  // Edit message passing
  if (message.edit) {
    let db = indexedDB.open(["Notes"]);
    db.onsuccess = function (event) {
      db = event.target.result;
      const transaction = db.transaction(["Notes"], "readwrite");
      const objectStore = transaction.objectStore("Notes");
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
    };

    db.onerror = function (event) {
      console.log("Impossible to edit note in database");
    };

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
    let db = indexedDB.open(["Notes"]);
    db.onsuccess = function (event) {
      db = event.target.result;
      const request = db
        .transaction(["Notes"], "readwrite")
        .objectStore("Notes")
        .delete(message.delete.id);

      request.onerror = function () {
        console.log("Impossible to update database");
      };

      request.onsuccess = function (event) {
        console.log("Note deleted from database");
      };
    };

    db.onerror = function (event) {
      console.log("Impossible to delete note from database");
    };

    if (cachedNotes) {
      const index = cachedNotes.findIndex(
        (note) => note.id === message.delete.id
      );
      cachedNotes.splice(index, 1);
    }

    sendResponse({});
    return true;
  }
});
