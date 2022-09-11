import { initializeApp } from "firebase/app";
import {
	getFirestore,
	collection,
	doc,
	getDocs,
	query,
	addDoc,
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
	document
		.getElementById("btnAddPerson")
		.addEventListener("click", showOverlay);
	document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
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
	getPeople();
	getGifts();
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
        </li>
		`;
	});
};
const displayGifts = (data) => {
	if (!currentPerson) return;
	const listContainer = document.querySelector(".idea-list");
	listContainer.innerHTML = data.map((doc) => {
		if (doc.reference.id !== currentPerson.id) return;
		return `<li class="idea" data-id="${doc.id}">
		<label for="${doc.id}">
			<input type="checkbox" id="${doc.id}" />
			Bought
		</label>
		<p class="title">${doc.idea}</p>
		<p class="location">${doc.location}</p>
	</li> `;
	});
};
// Button Handlers
const handleSavePerson = (ev) => {
	let nameInput = document.getElementById("name").value;
	let birthMonthInput = document.getElementById("month").value;
	let birthDayInput = document.getElementById("day").value;
	addPerson({
		name: nameInput,
		"birth-day": parseInt(birthMonthInput),
		"birth-month": parseInt(birthDayInput),
	});
	hideOverlay(ev);
};

const handleSaveIdea = (ev) => {
	let titleInput = document.getElementById("title").value;
	let locationInput = document.getElementById("location").value;
	addIdea({
		idea: titleInput,
		location: locationInput,
		reference: doc(db, "people", currentPerson.id),
	});
	hideOverlay(ev);
};
// Get all docs in the people collection
const getPeople = () => {
	people = [];
	const q = query(collection(db, "people"));
	getDocs(q)
		.then((snap) => {
			snap.forEach((doc) => {
				const data = doc.data();
				people.push({
					...data,
					id: doc.id,
				});
			});
		})
		.then(() => {
			displayPeople(people);
		});
};
// Get all docs in the gifts collection
const getGifts = () => {
	gifts = [];
	const q = query(collection(db, "gift-ideas"));
	getDocs(q)
		.then((snap) => {
			snap.forEach((doc) => {
				const data = doc.data();
				gifts.push(data);
			});
		})
		.then(() => {
			displayGifts(gifts);
		});
};
// Create a new document in the people collection with the given object
const addPerson = (person) => {
	const ref = collection(db, "people");
	addDoc(ref, person)
		.then(() => {
			getPeople();
		})
		.catch((err) => console.log(err));
};

// Create a new gift for the person with the given object
const addIdea = (giftIdea) => {
	const ref = collection(db, "gift-ideas");
	addDoc(ref, giftIdea)
		.then(() => {})
		.catch((err) => console.warn(err));
};
