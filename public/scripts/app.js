// Import Firebase modules using ES modules (v9+ syntax)
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// Your Firebase configuration
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Handle logout
function handleLogout(event) {
    event.preventDefault();
    signOut(auth)
        .then(() => {
            // console.log('User signed out successfully');
            window.location.href = 'login.html';
        })
        .catch((error) => {
            // console.error('Error during sign-out:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // Handle Sign-up Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Retrieve form values
            const displayName = document.getElementById('displayName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Check if passwords match
            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                return;
            }

            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update the user profile to include the display name
                await updateProfile(user, {
                    displayName: displayName
                });

                await saveUserToFirestore(user);

                alert('Sign-up successful! Welcome, ' + displayName);
                window.location.href = '/index.html'; // Redirect after signup

            } catch (error) {
                // console.error('Error during sign-up:', error.message);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    alert('Login successful!');
                    // console.log('Logged in:', user);
                    window.location.href = '/index.html';
                })
                .catch((error) => {
                    // console.error('Error during login:', error.message);
                    alert(`Error: ${error.message}`);
                });
        });
    }

    async function saveUserToFirestore(user) {
        try {
            // Reference to the 'users' collection and the document with user.uid
            const userRef = doc(collection(db, 'users_chat'), user.uid);

            // Set user data in Firestore
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
            });

            const reportRef = doc(collection(db, 'report'), user.uid);
            await setDoc(reportRef, {
                bad: 0,
                good: 0,
                items_sold: 0,
                reviews: 0,
                sales: 0,
                total_stars: 0
            });

            // console.log('User saved successfully!');
        } catch (error) {
            // console.error('Error saving user:', error);
        }
    }

    // Check Authentication Status
    onAuthStateChanged(auth, (user) => {
        // console.log('onAuthStateChanged triggered');

        const welcomeMessage = document.getElementById('welcome-message');
        const loginLogoutBtn = document.getElementById('login-logout-btn');

        if (user) {
            // console.log('User detected:', user);
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${user.displayName || user.email}!`;
            }
            if (loginLogoutBtn) {
                loginLogoutBtn.textContent = 'Logout';
                loginLogoutBtn.removeAttribute('href');
                loginLogoutBtn.addEventListener('click', handleLogout);
            }
        } else {
            // console.log('No user detected');
            if (welcomeMessage) {
                welcomeMessage.textContent = 'Welcome, Guest!';
            }
            if (loginLogoutBtn) {
                loginLogoutBtn.textContent = 'Login';
                loginLogoutBtn.setAttribute('href', '/login.html');
                loginLogoutBtn.removeEventListener('click', handleLogout);
            }
        }
    });
});
