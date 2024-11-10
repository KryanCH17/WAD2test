import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration (reinitialize here)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyALbJJCcRibFqa7HVcadIYAgBBzbTREkiY",
    authDomain: "hustlersathome-b9bee.firebaseapp.com",
    databaseURL: "https://hustlersathome-b9bee-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hustlersathome-b9bee",
    storageBucket: "hustlersathome-b9bee.appspot.com",
    messagingSenderId: "447459076084",
    appId: "1:447459076084:web:f26efa8cd4e33523a63ba1",
    measurementId: "G-5S6WET94BS"
  };

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig); // Initialize Firebase if not already initialized
} else {
    app = getApps()[0]; // Use the existing initialized Firebase app
}

// Initialize Firebase Authentication
const auth = getAuth(app);

// Function to handle the "Add a post" button click
function handleAddPostClick() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = '/addpost.html'; // Redirect to add post page
        } else {
            window.location.href = '/login.html'; // Redirect to login page
        }
    });
}

// Attach event listener to the "Add a post" button
document.getElementById('add-post-btn').addEventListener('click', handleAddPostClick);
