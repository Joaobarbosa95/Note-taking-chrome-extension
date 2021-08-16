// Get dabase
chrome.runtime.sendMessage("get-database", async function (response) {
  // Async response with the data from the background
  const db = response.database;
  // Get current Url
  const url = await getCurrentTab();

  const body = document.querySelector("body");
  const notesBody = document.querySelector(".notes");

  const newNote = document.querySelector("#new-note-btn");
  const saveNote = document.querySelector("#save-note-btn");
  const rejectNote = document.querySelector("#reject-note-btn");

  const toggle = document.querySelector("#toggle-btn");
  const footer = document.querySelector("footer");

  const info = document.querySelector("#info-btn");
  const infoText = document.querySelector("#info-text");

  info.addEventListener("mouseover", function () {
    elementVisible(infoText, true);
  });

  info.addEventListener("mouseleave", function() {
    elementVisible(infoText, false)
  })

  windowSize();
  renderNotes("href");
  addToggleFunctionality();

  // Add new note functionality
  newNote.addEventListener("click", () => {
    addNewNote();
  });

  // Add save note functionality
  saveNote.addEventListener("click", (e) => {
    const textarea = document.querySelector("textarea");
    textarea.hasAttribute("id")
      ? saveEditedNote(textarea)
      : saveNotes(textarea);
  });

  // Add reject note functionality
  rejectNote.addEventListener("click", () => {
    const textarea = document.querySelector("textarea");
    rejectNotes(textarea);
  });

  // Add download notes functionality
  downloadNotes();

  /**
   * FUNCTIONS DEFINITION
   */

  // dinamically set popup window size
  function windowSize() {
    const html = document.querySelector("html");

    chrome.storage.sync.get("popup", function ({ popup }) {
      body.style.width = popup.width + "px";
      body.style.height = popup.height + "px";
      notesBody.style.height = popup.height - 90 + "px";

      const zoomIn = document.querySelector(".bi-zoom-in");
      const zoomOut = document.querySelector(".bi-zoom-out");

      zoomOut.addEventListener("click", function () {
        popup.width -= popup.zoomIn;
        popup.height -= popup.zoomIn;
        chrome.storage.sync.set({ popup });
        html.style.width = body.style.width = popup.width + "px";
        html.style.height = body.style.height = popup.height + "px";
        notesBody.style.height = popup.height - 90 + "px";
      });

      zoomIn.addEventListener("click", function () {
        popup.width += popup.zoomOut;
        popup.height += popup.zoomOut;
        chrome.storage.sync.set({ popup });
        html.style.width = body.style.width = popup.width + "px";
        html.style.height = body.style.height = popup.height + "px";
        notesBody.style.height = popup.height - 90 + "px";
      });
    });
  }

  // Render notes to UI
  function renderNotes(site) {
    // Filter notes by hostname or url
    let hostnameNotes = db.filter((note) => note[site] === url[site]);

    // Sort by bookmarked
    hostnameNotes.sort((a, b) => a.bookmarked - b.bookmarked);

    // Clear UI
    notesBody.innerHTML = "";

    // Add notes
    for (let note in hostnameNotes) {
      const html = `
            <div id=${hostnameNotes[note].id} class="note">
                <div class="note-text">
                    ${hostnameNotes[note].text.replaceAll("\n", "<br>")} 
                </div>
                <div class="note-actions">
                    <div class="note-actions-box">
                        <i class="bi bi-pencil-square"></i>
                        <i class="bi ${
                          hostnameNotes[note].bookmarked
                            ? "bi-bookmark-star-fill"
                            : "bi-bookmark-star"
                        }"></i>
                        <i class="bi bi-trash delete"></i>
                    </div>
                </div>
            </div>`;
      notesBody.insertAdjacentHTML("afterbegin", html);
    }

    // Add note actions functionality
    editNote();
    deleteNote();
    bookmarkNote();
  }

  /**
   * Toggle Url/Hostname button
   */
  function addToggleFunctionality() {
    toggle.addEventListener("click", function () {
      toggle.className.includes("bi-toggle-on")
        ? renderHrefNotes()
        : renderHostNotes();
    });
  }

  function addNewNote() {
    // hide new note btn
    elementVisible(newNote, false);

    // Display save and reject buttons
    elementVisible(saveNote, true);
    elementVisible(rejectNote, true);

    // hide notes body to display new note textarea
    elementVisible(notesBody, false);

    // Open textarea and note graphic design
    const note = document.createElement("div");
    note.setAttribute("class", "note");
    body.appendChild(note);
    note.style.height = "70%";
    const textarea = document.createElement("textarea");
    note.appendChild(textarea);

    // Textarea graphic design
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.resize = "none";
  }

  // Save notes
  function saveNotes(textarea) {
    const text = textarea.value;

    // New note object
    const noteObj = {
      id: new Date().getTime(),
      text: text,
      bookmarked: false,
      hostname: url.hostname,
      href: url.href,
    };

    // Updates indexedDB and cached notes
    chrome.runtime.sendMessage({ note: noteObj }, function (response) {
      // Removes textarea element
      const n = textarea.parentNode;
      n.parentNode.removeChild(n);

      // Display new note btn
      elementVisible(newNote, true);

      // Hide save and reject buttons
      elementVisible(saveNote, false);
      elementVisible(rejectNote, false);

      // Render notes
      elementVisible(notesBody, true);

      // Update
      db.push(noteObj);

      // Render UI
      toggleButtonRender();
    });
  }

  function rejectNotes(textarea) {
    const n = textarea.parentNode;
    n.parentNode.removeChild(n);

    // Hide save and reject buttons
    elementVisible(saveNote, false);
    elementVisible(rejectNote, false);

    // Show new note button
    elementVisible(newNote, true);

    // Render notes body
    elementVisible(notesBody, true);
  }

  function editNote() {
    const editBtns = document.querySelectorAll(".bi-pencil-square");
    editBtns.forEach((btn) =>
      btn.addEventListener("click", function (e) {
        const id = e.path[3].id;
        addNewNote();
        const textarea = document.querySelector("textarea");
        textarea.setAttribute("id", id);
        textarea.value = e.path[3].firstElementChild.innerHTML
          .replaceAll("<br>", "\n")
          .trim();
      })
    );
  }

  function saveEditedNote(textarea) {
    // Note id
    const id = Number(textarea.id);
    // Find note and update text value
    const index = db.findIndex((note) => note.id === id);
    db[index].text = textarea.value;

    // Update database and cache
    chrome.runtime.sendMessage(
      { edit: { id: id, text: textarea.value } },
      function (response) {
        const elementToRemove = textarea.parentNode;
        elementToRemove.parentNode.removeChild(elementToRemove);

        // Display new note btn
        elementVisible(newNote, true);
        // Hide save btn and reject btn
        elementVisible(saveNote, false);
        elementVisible(rejectNote, false);

        // Render notes
        elementVisible(notesBody, true);

        toggleButtonRender();
      }
    );
  }

  function deleteNote() {
    const deleteBtns = document.querySelectorAll(".delete");
    deleteBtns.forEach((btn) =>
      btn.addEventListener("click", function (e) {
        const note = e.path[3];
        const id = Number(e.path[3].id);
        const index = db.findIndex((note) => note.id === id);
        db.splice(index, 1);
        note.parentNode.removeChild(note);
        chrome.runtime.sendMessage({ delete: { id: id } }, function (response) {
          console.log("Note deleted successfully");
        });
      })
    );
  }

  function bookmarkNote() {
    const bookmarkBtns = document.querySelectorAll("[class*='bi-bookmark']");

    bookmarkBtns.forEach((btn) =>
      btn.addEventListener("click", function (e) {
        const id = Number(e.path[3].id);
        const index = db.findIndex((note) => note.id === id);
        let value;

        if (e.target.className.includes("bi-bookmark-star-fill")) {
          e.target.setAttribute("class", "bi bi-bookmark-star");
          value = db[index].bookmarked = false;
        } else {
          e.target.setAttribute("class", "bi bi-bookmark-star-fill");
          value = db[index].bookmarked = true;
        }

        chrome.runtime.sendMessage(
          { edit: { id: id, bookmark: value } },
          function (response) {
            toggleButtonRender();
          }
        );
      })
    );
  }

  // Download Host notes
  function downloadNotes() {
    const downloadBtn = document.querySelector(".bi-download");
    downloadBtn.addEventListener("click", function () {
      notesData = db.filter((note) => note["hostname"] === url["hostname"]);

      const json = JSON.stringify(notesData);
      const blob = new Blob([json], {
        type: "text/plain;charset=utf-8",
      });
      const link = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = "Papyrus_Notes.txt";
      a.href = link;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // Render Href notes
  function renderHrefNotes() {
    toggle.removeAttribute("bi-toggle-on");
    toggle.setAttribute("class", "bi-toggle-off bi");
    footer.style.background = "#4782c9";
    renderNotes("href");
  }

  // Render Host notes
  function renderHostNotes() {
    toggle.removeAttribute("bi-toggle-off");
    toggle.setAttribute("class", "bi-toggle-on bi");
    footer.style.background = "#ff4711";
    renderNotes("hostname");
  }

  // Render notes based on toggle button position
  function toggleButtonRender() {
    toggle.className.includes("bi-toggle-off")
      ? renderHrefNotes()
      : renderHostNotes();
  }

  // Show/hide elements
  function elementVisible(element, boolean) {
    if (boolean) {
      element.style.display = "block";
      element.style.visibility = "visible";
    } else {
      element.style.display = "none";
      element.style.visibility = "hidden";
    }
  }
});
