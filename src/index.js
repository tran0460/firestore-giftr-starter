import { initializeApp } from "firebase/app";
import {
	getFirestore,
	collection,
	doc,
	getDocs,
	query,
	addDoc,
} from "firebase/firestore";

// Your web app's Firebase configuration

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

document.addEventListener("DOMContentLoaded", () => {
	//set up the dom events
	document
		.getElementById("btnCancelPerson")
		.addEventListener("click", hideOverlay);
	document
		.getElementById("btnCancelIdea")
		.addEventListener("click", hideOverlay);
	document.querySelector(".overlay").addEventListener("click", hideOverlay);
	document
		.getElementById("btnAddPerson")
		.addEventListener("click", showOverlay);
	document.getElementById("btnAddIdea").addEventListener("click", showOverlay);
	getPeople();
});
// Variables
let people = [];
let currentPerson = {};

// Functions
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
	//TODO: check that person is selected before adding an idea
	document.getElementById(id).classList.add("active");
}

const getPeople = () => {
	people = [];
	const q = query(collection(db, "people"));
	getDocs(q).then((snap) => {
		snap.forEach((doc) => {
			const data = doc.data();
			people.push(data);
		});
	});
};

const addPerson = (person) => {
	const ref = collection(db, "people");
	addDoc(ref, person).then(() => {
		console.log("done");
	});
};
