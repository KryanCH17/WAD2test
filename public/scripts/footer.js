// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase configuration (use environment variables if using Vite/Webpack)
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

// Initialize Firebase if it hasn’t been initialized already
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Vue app setup
const vueApp = Vue.createApp({
    data() {
        return {
            message: '',
            user: null // Holds the current user state
        };
    },
    created() {
        // Listen for authentication state changes
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            // console.log("User authentication state changed:", user);
        });
    },
    methods: {
        async subscribe() {
            // Check if the user is logged in
            if (!this.user) {
                this.message = "You must be logged in to subscribe.";
                return;
            }

            try {
                // Reference to the specific document (user's UID as document ID)
                const subscriberDocRef = doc(db, 'subscribers', this.user.uid);
                
                // Check subscribtion
                const subscriberDocSnap = await getDoc(subscriberDocRef);
                if (subscriberDocSnap.exists()) {
                    this.message = 'Email is already subscribed!';
                    return;
                }

                // set subscribtion using the email
                await setDoc(subscriberDocRef, {
                    email: this.user.email,
                    timestamp: serverTimestamp()
                });
    
                this.message = 'Subscribed to Newsletter! Your newsletter will appear on the 1st of every month!';
    
            } catch (error) {
                console.error("Error during subscription process:", error);
                this.message = 'There was an error subscribing. Please try again.';
            }
        }
    }
    
});

// Mount the Vue instance
vueApp.mount('#app');
