import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper function to upload files to Firebase Storage and update Firestore
async function uploadFile(collection, filePath, file, uid) {
    const storageRef = ref(storage, filePath);
    try {
        await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(storageRef);
        const docRef = doc(db, collection, uid);
        await setDoc(docRef, { url: fileUrl, uploadedAt: Date.now() }, { merge: true });
        return fileUrl;
    } catch (error) {
        console.error(`Error uploading ${collection}:`, error.message);
        throw error;
    }
}

// Helper function to fetch and display Firestore documents
async function fetchAndDisplayDoc(collection, uid, elementId, defaultSrc, uploadSectionId, editButtonId) {
    try {
        console.log(`Fetching document from collection: ${collection}, for user: ${uid}`);
        const docRef = doc(db, collection, uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const { url } = docSnap.data();
            console.log("Document fetched successfully. URL:", url);

            const element = document.getElementById(elementId);
            if (element) {
                element.src = url;
                element.onload = () => {
                    element.style.display = "block"; // Ensure it's visible after loading
                    console.log("QR Code loaded and displayed.");
                };
            }

            const editButton = document.getElementById(editButtonId);
            if (editButton) {
                editButton.style.display = "inline";
                editButton.style.display = "inline-block";
                editButton.style.margin = "0 auto";
            }
        } else {
            console.warn(`No document found in collection '${collection}' for user '${uid}'.`);
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId == "profileImage") {
                    const imgEle = ref(storage, `profilePictures/${defaultSrc}`);
                    const proPicUrl = await getDownloadURL(imgEle);
                    element.src = proPicUrl || "";
                } else {
                    element.src = defaultSrc || "";
                    //element.style.display = "none"; // Hide if no document found
                }
            }

            const uploadSection = document.getElementById(uploadSectionId);
            if (uploadSection) uploadSection.style.display = "block";
        }
    } catch (error) {
        console.error(`Error fetching document from ${collection} for user ${uid}:`, error.message);
    }
}

// Fetch and display user data on page load
async function fetchData() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const uid = user.uid;
            const name = user.displayName
            console.log("Authenticated user:", uid);

            const usernameElement = document.getElementById("username");
            if (usernameElement) {
                usernameElement.textContent = user.displayName || "Username";
            } else {
                console.warn("Username element not found in the DOM.");
            }

            // Fetch and display profile picture and QR code
            await fetchAndDisplayDoc("profilePictures", uid, "profileImage", "default-profile.jpg", "profileUploadSection", "editProfileImageButton");
            await fetchAndDisplayDoc("qrCodes", uid, "uploadedQRCode", "", "qrCodeUploadSection", "editQRCodeButton");
            await fetchStats(uid);
        } else {
            console.log("User is not signed in.");
        }
    });
}

async function fetchStats(uid) {
    try {
        const docRef = doc(db, "report", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('sales').textContent = data.sales || 0;
            document.getElementById('itemsSold').textContent = data.items_sold || 0;
            document.getElementById('reviewsReceived').textContent = data.reviews || 0;
            document.getElementById('goodReviews').textContent = data.good || 0;
            document.getElementById('badReviews').textContent = data.bad || 0;
            document.getElementById('stars').textContent = (data.total_stars / data.reviews).toFixed(2) || 0;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Functions to handle uploads
async function uploadProfilePicture(file) {
    const user = auth.currentUser;
    if (user) {
        const uid = user.uid;
        const filePath = `profilePictures/${uid}`;
        try {
            const url = await uploadFile("profilePictures", filePath, file, uid);
            const element = document.getElementById("profileImage");
            if (element) element.src = url;
            console.log("Profile Picture uploaded successfully.");
        } catch (error) {
            alert("Failed to upload Profile Picture. Please try again.");
        }
    } else {
        alert("You must be signed in to upload a Profile Picture.");
    }
}

async function uploadQRCode(file) {
    const user = auth.currentUser;
    if (user) {
        const uid = user.uid;
        const filePath = `qrCodes/${uid}`;
        try {
            const url = await uploadFile("qrCodes", filePath, file, uid);
            const element = document.getElementById("uploadedQRCode");
            if (element) {
                element.src = url;
                element.style.display = "block"; // Make it visible
            }
            console.log("QR Code uploaded successfully.");
        } catch (error) {
            alert("Failed to upload QR Code. Please try again.");
        }
    } else {
        alert("You must be signed in to upload a QR Code.");
    }
}

// Event listeners for profile picture upload
document.getElementById("editProfileImageButton").addEventListener("click", () => {
    document.getElementById("profileUploadSection").style.display = "block";
});
document.getElementById("uploadProfileButton").addEventListener("click", () => {
    const file = document.getElementById("profileImageUpload").files[0];
    if (file) uploadProfilePicture(file);
    else alert("Please select a Profile Picture to upload.");
});

// Event listeners for QR code upload
document.getElementById("editQRCodeButton").addEventListener("click", () => {
    document.getElementById("qrCodeUploadSection").style.display = "block";
});
document.getElementById("uploadQRCodeButton").addEventListener("click", () => {
    const file = document.getElementById("qrCodeUpload").files[0];
    if (file) uploadQRCode(file);
    else alert("Please select a QR Code image to upload.");
});

// Fetch data on page load
fetchData();
