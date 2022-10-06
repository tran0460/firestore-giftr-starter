import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

/* FIREBASE CONFIGS */
const firebaseConfig = {
  apiKey: "AIzaSyC0XzZoj3FAdhB8Op0ZvpBVP86x3xnFKqQ",
  authDomain: "fire-giftr-b6e2b.firebaseapp.com",
  projectId: "fire-giftr-b6e2b",
  storageBucket: "fire-giftr-b6e2b.appspot.com",
  messagingSenderId: "92715867891",
  appId: "1:92715867891:web:b48b24b0c66b47e7686186",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Auth
const auth = getAuth(app);
// get a reference to the database
const db = getFirestore(app);

/* VARIABLES */
let people = [];
let gifts = [];
let currentPerson;
let currentGift;
let personOverlayMode = "new";
let giftOverlayMode = "new";

/* LISTENERS */
document.addEventListener("DOMContentLoaded", async (ev) => {
  // Prevent overlay from appearing
  hideOverlay(ev);
  //set up the dom events
  document
    .getElementById("btnCancelPerson")
    .addEventListener("click", hideOverlay);
  document
    .getElementById("btnCancelIdea")
    .addEventListener("click", hideOverlay);
  document
    .querySelector(".invisible-bg")
    .addEventListener("click", hideOverlay);
  document.getElementById("btnAddPerson").addEventListener("click", (ev) => {
    personOverlayMode = "new";
    showOverlay(ev);
  });
  document.getElementById("btnAddIdea").addEventListener("click", (ev) => {
    giftOverlayMode = "new";
    showOverlay(ev);
  });
  document
    .getElementById("btnSavePerson")
    .addEventListener("click", handleSavePerson);
  document
    .getElementById("btnSaveIdea")
    .addEventListener("click", handleSaveIdea);
  // Initial setup
  document.querySelector(".person-list").addEventListener("click", (ev) => {
    // If user accidentally clicks on ul, do nothing
    if (ev.target.localName === "ul" || ev.target.localName === "button")
      return;
    selectPerson(
      people.find((item) => item.id === ev.target.getAttribute("data-id"))
    );
  });
});

/*********FUNCTIONS*********/
// UI related
function hideOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.remove("active");
  document
    .querySelectorAll(".overlay dialog")
    .forEach((dialog) => dialog.classList.remove("active"));
}
function showOverlay(ev) {
  ev.preventDefault();
  document.querySelector(".overlay").classList.add("active");
  const id = ev.target.id === "btnAddPerson" ? "dlgPerson" : "dlgIdea";
  document.getElementById(id).classList.add("active");
}

const selectPerson = (newPerson) => {
  currentPerson = newPerson;
  if (newPerson === undefined) return;
  // If theres another active list item, make it not active anymore
  if (document.querySelector("li.selected"))
    document.querySelector("li.selected").className = "person";
  // Make the current person list item active
  document.querySelector(`[data-id="${currentPerson?.id}"]`).className =
    "person selected";
  displayGifts(gifts);
};

// Takes the people data and set the innerHTML of the list container for each person
const displayPeople = (data) => {
  if (currentPerson != undefined) selectPerson(currentPerson);
  const listContainer = document.querySelector(".person-list");
  listContainer.addEventListener("click", (e) => {
    if (e.target.localName != "button") return;
    if (e.target.className === "edit-person") {
      selectPerson(
        data?.find(
          (item) => item.id === e.target.parentElement.getAttribute("data-id")
        )
      );
      personOverlayMode = "edit";
      // set the form values
      document.getElementById("name").value = currentPerson.name;
      document.getElementById("month").value = currentPerson["birth-month"];
      document.getElementById("day").value = currentPerson["birth-day"];
      // toggle overlay
      e.target.id = "btnAddPerson";
      showOverlay(e);
    }
    if (e.target.className === "delete-person") {
      deletePerson(
        data?.find(
          (item) => item.id === e.target.parentElement.getAttribute("data-id")
        ).id
      );
    }
  });
  if (data.length === 0) {
    selectPerson(undefined);
    displayGifts([]);
    return (listContainer.innerHTML =
      '<li class="idea"><p></p><p>You have no friends :( </p></li>');
  }
  listContainer.innerHTML = data.map((doc) => {
    let dob = new Date();
    dob.setMonth(doc["birth-month"] - 1);
    dob.setDate(doc["birth-day"]);
    return `
				<li data-id="${doc.id}" class="person ${data.length === 1 ? "selected" : ""}">
				<p class="name">${doc.name}</p>
				<p class="dob">${dob.toDateString().substring(4, 10)}
				</p>
				<button class="edit-person">Edit</button> 
				<button class="delete-person">Delete</button> 
				</li>
				`;
  });
  selectPerson(data[0]);
};
// Takes the people data and set the innerHTML of the list container for each gift
const displayGifts = (data) => {
  const listContainer = document.querySelector(".idea-list");
  if (!currentPerson) return (listContainer.innerHTML = "");
  listContainer.addEventListener("click", (e) => {
    switch (e.target.localName) {
      case "input":
        editIdea(e.target.parentElement.parentElement.getAttribute("data-id"), {
          bought: e.target.checked,
        });
        break;
      case "button":
        currentGift = gifts.find(
          (gift) => gift.id === e.target.parentElement.getAttribute("data-id")
        );
        if (e.target.className === "edit-idea") {
          giftOverlayMode = "edit";
          // find the data for the item the user has clicked
          // set the form values
          document.getElementById("title").value = currentGift.idea;
          document.getElementById("location").value = currentGift.location;
          // toggle overlay
          showOverlay(e);
        }
        if (e.target.className === "delete-idea") {
          deleteIdea(currentGift.id);
        }
        break;
    }
  });
  let currentPersonGifts = data.filter((doc) => {
    return doc["person-id"].id === currentPerson.id ? doc : null;
  });
  if (currentPersonGifts.length == 0)
    // if there are no gifts
    return (listContainer.innerHTML =
      '<li class="idea"><p></p><p>No Gift Ideas for selected person.</p></li>');
  listContainer.innerHTML = currentPersonGifts.map((doc) => {
    return `<li class="idea" data-id="${doc.id}">
		<label for="${doc.id}">
			<input type="checkbox" class="gift-status" id="${doc.id}" ${
      doc.bought === true ? "checked" : "unchecked"
    }/>
			Bought
		</label>
		<p class="title">${doc.idea}</p>
		<p class="location">${doc.location}</p>
		<button class="edit-idea">Edit</button> 
		<button class="delete-idea">Delete</button> 
	</li> `;
  });
};
// Button Handlers
// Saves the form value and create a person document from them
const handleSavePerson = (ev) => {
  let nameInput = document.getElementById("name").value;
  let birthMonthInput = document.getElementById("month").value;
  let birthDayInput = document.getElementById("day").value;
  if (personOverlayMode === "new") {
    addPerson({
      name: nameInput,
      "birth-month": parseInt(birthMonthInput),
      "birth-day": parseInt(birthDayInput),
    });
  }
  if (personOverlayMode === "edit") {
    editPerson(currentPerson.id, {
      name: nameInput,
      "birth-month": parseInt(birthMonthInput),
      "birth-day": parseInt(birthDayInput),
    });
  }
  hideOverlay(ev);
  // reset form fields
  document.getElementById("name").value = "";
  document.getElementById("month").value = 1;
  document.getElementById("day").value = 1;
};
// Saves the form value and create a gift document from them
const handleSaveIdea = (ev) => {
  let titleInput = document.getElementById("title").value;
  let locationInput = document.getElementById("location").value;
  if (giftOverlayMode === "new") {
    addIdea({
      idea: titleInput,
      location: locationInput,
      "person-id": doc(db, "people", currentPerson.id),
      bought: false,
    });
  }
  if (giftOverlayMode === "edit") {
    editIdea(currentGift.id, {
      idea: titleInput,
      location: locationInput,
    });
  }
  hideOverlay(ev);
  // reset form fields
  document.getElementById("title").value = "";
  document.getElementById("location").value = "";
};
// Listen for auth state changes
const authCheck = () => {
  let userCleanup;
  let giftsCleanup;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid;
      // TODO: set up listeners, display page
      // Set up listeners
      userCleanup = createPeopleListener();
      giftsCleanup = createGiftsListener();
      // ...
    } else {
      // ...
      // TODO: clean up listeners, clear page
      if (!userCleanup && !giftsCleanup) return;
    }
  });
};
// Listen to the people collection
const createPeopleListener = () => {
  const ref = collection(db, "people");
  let cleanup = onSnapshot(
    ref,
    { includeMetadataChanges: true },
    async (snapshot) => {
      people = [];
      snapshot.docs.forEach((doc) => {
        let data = doc.data();
        people.push({
          ...data,
          id: doc.id,
        });
      });
      await displayPeople(people);
    }
  );
  return cleanup;
};
// Listen to gifts collection
const createGiftsListener = () => {
  const ref = collection(db, "gift-ideas");
  let cleanup = onSnapshot(
    ref,
    { includeMetadataChanges: true },
    async (snapshot) => {
      gifts = [];
      snapshot.docs.forEach((doc) => {
        let data = doc.data();
        gifts.push({ ...data, id: doc.id });
      });
      displayGifts(gifts);
    }
  );
  return cleanup;
};
// Create a new document in the people collection with the given object
const addPerson = (person) => {
  const ref = collection(db, "people");
  addDoc(ref, person)
    .then(() => {
      createPeopleListener();
    })
    .catch((err) => console.log(err));
};

// Edit the person with the given id using the given obj
const editPerson = (id, newValues) => {
  const ref = doc(db, "people", `${id}`);
  updateDoc(ref, newValues).catch((err) => console.warn(err));
};

// Delete the document with the given id from firestore
const deletePerson = (id) => {
  let ref = doc(db, "people", `${id}`);
  deleteDoc(ref).catch((err) => console.warn(err));
};

// Create a new gift for the person with the given object
const addIdea = (giftIdea) => {
  const ref = collection(db, "gift-ideas");
  addDoc(ref, giftIdea)
    .then(() => {})
    .catch((err) => console.warn(err));
};

// Edit the gift with the given id using the given obj
const editIdea = (id, newValues) => {
  const ref = doc(db, "gift-ideas", `${id}`);
  updateDoc(ref, newValues).catch((err) => console.warn(err));
};

// Delete the document with the given id from firestore
const deleteIdea = (id) => {
  let ref = doc(db, "gift-ideas", `${id}`);
  deleteDoc(ref).catch((err) => console.warn(err));
};
