import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase configuration
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
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);

// Vue App for Navbar
const navbarApp = Vue.createApp({
    data() {
        return {
            user: null,
            username: "Guest",
            authButtonText: "Login",
        };
    },
    methods: {
        handleAuth() {
            if (this.user) {
                // Logout
                signOut(auth)
                    .then(() => {
                        this.user = null;
                        this.username = "Guest";
                        this.authButtonText = "Login";
                        window.location.href = "/login.html";
                    })
                    .catch((error) => {
                        console.error("Error logging out:", error);
                    });
            } else {
                // Redirect to Login
                window.location.href = "/login.html";
            }
        },
    },
    mounted() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.user = user;
                this.username = user.displayName || "Account";
                this.authButtonText = "Logout";
            } else {
                this.user = null;
                this.username = "Guest";
                this.authButtonText = "Login";
            }
        });
    },
});

navbarApp.mount("#navbar-app");
