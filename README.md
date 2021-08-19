# Papyrus

#### Video Demo: <URL HERE>

#### Description:

The project is a note tacking Chrome extension. The funcionality includes window size control, note adding, editing and removel, bookmarking, downloading notes and the metadata in JSON format.
There is a toggle where you can see the notes by URL or hostname, just in case you had a note linked to a URL that changed or no longer exists. In this case it will be rendered just the same in the hostname notes UI.
[Popup](Popup.png)
You can also select text, right click to see the context box, where you´ll the Papyrus symbol. Clicking it will add the note directly to your extension database, rendering it the next time the extension popup is opened.
[Context-box](Context-box.png)

###### Background.js

The first thing the extension does on installment is to create an object containing the standart width, height, zoom in/out change rate and an indexedDB database to save the notes and metadata, and a context box.
The object and database will be saved in diferent places because:

- the popup info will be requested everytime the extension popup is opened and it would be slower if searched in the database (would be mixed with the notes)
- it is much easier to save and organize data with indexedDB
- indexedDB has more room for database upgrades and scalability.

After installment, background.js will have the responsability to responde to content.js "events" (it is called message passing).
There are a few types of message to respond to:

- initial db query, when popup is opened
- create, edit and delete note
- change bookmark note status
- clear all notes in database

When the extension popup is clicked, a "get-database" message will be passed to background.js in order to load it to the UI.
Background.js will close itself after some time, but if the popup is click multiple times in a short time period, after the first click the notes will be cached to reduce the database opening and avoid latency.
All other messages basically the same: open the database to permanently change the database and update the cached notes based on the changes made.

The context box function will only be dealt in the background.js.
We handle the cases where there is no text, then create a note object much like content.js and write it to the database, updating also the cached notes.

Chrome extensions don´t support async/await code. So in order to abstract the repeated boiler plate code to open the database, I created a function called "openDB" which return a Promise, resolving with a objectStore (database) or simply rejecting it.

I could also abstract more about the database boiler plate, like the request error handling, but in my opinion, it is not straight forward as the database opening and would add unecessary complexity to the app.

###### Content.js

When the extension popup icon is click, Content.js will be loaded.
The first thing it will do is send a message to the Background.js file querying the database or the cached notes.
This message also serves as a main function wrapper.
After receiving the notes, we get the current url function so we can add the metadata info on notes created.
Then we have a series of querySelectors. I decide do this at the top and inside the message response function because, in order to create the functionality I wanted, functions needed several repeated selector arguments (some 7 or 8), so I would have to call 6 or 7 functions with the same arguments. It got messy to control the arguments order and, in the future, code maintenance would be hell.
All the selectors will be used to create the function abstractions at the end of the file with improved readability and there will be no need to pass arguments all these selectors to almost all functions(works like global variables, in order to simplify the code).

The next functions called have the purpose of adding the functionality to our popup window.
Most of it is pretty forward:

- windowSize: sets the window size
- renderNotes: render notes to UI based on hostname
- addToggleFunctionality: add the toggle button functionality (url or hostname)
- downloadNotes: add download notes functionality

We also need to add the click and hover functionality to the buttons:

- addNewnote: changes to a textarea where the user can write notes.
- saveNote: this buttons will have the functions of saving a new note if the textarea has no id(which is set if the note is being edit) or if it has id just save the text to the same note.
- rejectNotes: will discard new notes or edited notes changes.
- info: set the visibility, on hover, of the information text.

After the functions calls are the funtions declarations. I will explain each, not by the order they appear, but for optimal code understanding.

- elementVisible
  This function takes an query selected element and a boolean (true to show the element, false to hide it). It is used to change the popup design when needed, like from rendered notes to textarea where notes are created/edited.

- renderNotes
  This function take an argument, which will be used to filter the database received by href or hostname, depeding on which one we're rendering.
  It also sorts the notes by bookmarked and then inserts them in the body with the metadata for each one.
  The last thing it does is to add the buttons actions functionality(edit, delete and bookmark) for all notes.

- deleteNote
  Add the functionality of delete to all "trash" buttons in the notes actions box.
  It updates the database we receive, because that is the one we are working with and it only gets update by the Background.js if we close the popup.
  It also sends a message to the Background.js page to update the indexedDB and the cached notes.

- editNote
  Select all edit buttons and add the functionality of editing by changing the UI to a textarea with the note text, where it can be changed and saved into the same note again (by clicking the save button)

- bookmarkNote
  Updates the database in use and sends a messag to Background.js to uptade the indexedDB and cached notes.
  It also changes the symbol, from normal to filled and vice-versa, so the user can identify the bookmarked notes.
  After clicked, render the notes again.

- renderHostNotes and renderHrefNotes
  Changes the footer color and class attribute which renders icon toggle position (the switch)
  Also calls renderNotes based on the wanted position

- toggleButtonRender
  When notes are rendered, it will dinamically render them based on the toggle position.
  Ex: if user clicked to bookmark a note in the url toggle position, the renderNotes function call will render the url notes again.

- downloadNotes
  This function just stringify the database and then then creates a blob with it.
  It abstracts and automates the creation of ObjectURL, the hyperlink element and the click to download.

- saveEditedNote
  This function changes the text value of the notes (only the one which in being edited), sending the new text value the the Background.js to be updated.
  It also goes back to the rendered notes UI.

- rejectNote
  This function just goes back to the original rendered notes UI, not updating anything.
  It is just the visual change, discarding any note changes.

- saveNotes
  This function creates the note object that will be saved.
  The difference between this and saveEditedNote is that in this case the note is brand new.
  A message will be sent to Background.js to insert the new note object into the database.
  After that, the UI will go back to the rendered notes UI, will be updated.

- addNewNote
  This function changes the design deleting the rendered notes and openening a textarea instead. This area will be used to write the note.
  The header buttons functionality also changes with the new note button becoming the save note button and a "trash" icon poping to reject/discard the note.

- addToggleFunctionality
  Adds the render functions to the toggle options when clicked: url(href) or hostname.

###### Helpers.js

This file contains only one function, that doesn't need arguments, and return a url object which will be used to create the notes (provides the hostname and url information).
I decided to put it in a different file because it is independent from the content.js file, which is already a bit bloated.

###### Index page

The index.html contains the popup layout. It is the base of the extension on which the notes the user creates will be added.
It uses some bootstrap icons for better user experience.
We have a header where the user can find the create a new note and zoom functionality, and when editing/creating notes, the save and reject note buttons.
The body is where the rendered notes will appear and the textarea to add/edit notes.
The footer has a info hover button with some important information about the extension, the toggle button and the download notes button.

###### Options page

This page has a form which sets the popup dimensions and zoom change. Also has 2 buttons, one to download, the other to delete all notes.
If the delete one is click, an hidden box will pop to ensure you didn't missclick this button.

###### Options.js

The options page was design to be easily used. It has 4 inputs camps so the user can set the popup window size precisely how they want and a the same for the zoom change values.
If saved the placeholder values will be updated.

This is accomplished by quering the Chrome storage API with the popup key and then dinamicaly set the placeholders.
When the submit button is clicked, if the input element has a value, it will be updated (storageValue function evaluates if the input field has value, save that value, else, save with placeholder value).

We also have the deleteDB function which deletes all notes in the database. When click, a new window will pop with a confirmation and abortion button.
This prevents that missclick wipes out the database.

The download function in file does the same as the one in Content.js but it downloads all notes stored in the database.
