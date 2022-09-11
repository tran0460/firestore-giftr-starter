import { initializeApp } from "firebase/app";
import {
	getFirestore,
	collection,
	doc,
	addDoc,
	onSnapshot,
	updateDoc,
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
		if (ev.target.localName === "ul") return;
		// If theres another active list item, make it not active anymore
		if (document.querySelector("li.selected"))
			document.querySelector("li.selected").className = "person";
		ev.target.className = "person selected";
		// Set current person variable to currently selected person
		currentPerson = people.find(
			(person) => person.id === ev.target.getAttribute("data-id")
		);
		displayGifts(gifts);
	});
	createPeopleListener({ selectFirstPerson: true });
	createGiftsListener();
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

const selectFirstPerson = () => {
	if (people.length === 0) return;
	document.querySelector(".person").className = "person selected";
	currentPerson = people[0];
};

// Takes the people data and set the innerHTML of the list container for each person
const displayPeople = (data) => {
	const listContainer = document.querySelector(".person-list");
	listContainer.innerHTML = data.map((doc) => {
		let dob = new Date();
		dob.setMonth(doc["birth-month"]);
		dob.setDate(doc["birth-day"]);
		return `
		<li data-id="${doc.id}" class="person">
            <p class="name">${doc.name}</p>
            <p class="dob">${dob.toDateString().substring(4, 10)}
				</p>
				<button class="edit-person">Edit</button> 
				<button class="delete-person">Delete</button> 
        </li>
		`;
	});
};
// Takes the people data and set the innerHTML of the list container for each gift
const displayGifts = (data) => {
	if (!currentPerson) return;
	const listContainer = document.querySelector(".idea-list");
	listContainer.addEventListener("click", (e) => {
		switch (e.target.localName) {
			case "input":
				editIdea(e.target.parentElement.parentElement.getAttribute("data-id"), {
					bought: e.target.checked,
				});
				break;
			case "button":
				if (e.target.className === "edit-idea") {
					giftOverlayMode = "edit";
					// find the data for the item the user has clicked
					currentGift = gifts.find(
						(gift) => gift.id === e.target.parentElement.getAttribute("data-id")
					);
					// set the form values
					document.getElementById("title").value = currentGift.idea;
					document.getElementById("location").value = currentGift.location;
					// toggle overlay
					showOverlay(e);
				}
				break;
		}
	});
	listContainer.innerHTML = data.map((doc) => {
		if (doc.reference.id !== currentPerson.id) return;
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
	if ((personOverlayMode = "new")) {
		addPerson({
			name: nameInput,
			"birth-day": parseInt(birthMonthInput),
			"birth-month": parseInt(birthDayInput),
		});
	}
	if (personOverlayMode === "edit") {
		editPerson(currentPerson.id, {
			name: nameInput,
			"birth-day": parseInt(birthMonthInput),
			"birth-month": parseInt(birthDayInput),
		});
	}
	hideOverlay(ev);
	// reset form fields
	nameInput = "";
	birthMonthInput = "";
	birthDayInput = "";
};
// Saves the form value and create a gift document from them
const handleSaveIdea = (ev) => {
	let titleInput = document.getElementById("title").value;
	let locationInput = document.getElementById("location").value;
	if (giftOverlayMode === "new") {
		addIdea({
			idea: titleInput,
			location: locationInput,
			reference: doc(db, "people", currentPerson.id),
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
	titleInput = "";
	locationInput = "";
};
// Listen to the people collection
const createPeopleListener = (options) => {
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
			if (options.selectFirstPerson) selectFirstPerson();
		}
	);
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
