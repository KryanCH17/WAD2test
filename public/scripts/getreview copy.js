import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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

async function fetchData() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            let documentId = user.displayName;
            document.getElementById('username').textContent = documentId || "Username";

            try {
                // Retrieve profile image from Firebase Storage
                const profileImageRef = ref(storage, `profileImages/${documentId}.jpg`);
                const profileImageUrl = await getDownloadURL(profileImageRef);
                document.getElementById('profileImage').src = profileImageUrl;
            } catch (error) {
                console.error("Error retrieving profile image:", error);
                const profileImageRef = ref(storage, `profileImages/default-profile.jpg`);
                const profileImageUrl = await getDownloadURL(profileImageRef);
                document.getElementById('profileImage').src = profileImageUrl;
            }

            try {
                // Retrieve and display uploaded image if it exists
                const uploadedImageRef = ref(storage, `additionalImages/${documentId}.jpg`);
                const uploadedImageUrl = await getDownloadURL(uploadedImageRef);

                document.getElementById('uploadedImage').src = uploadedImageUrl;
                document.getElementById('uploadedImage').style.display = 'block';
                document.getElementById('editImageButton').style.display = 'inline';
                document.getElementById('uploadSection').style.display = 'none';

            } catch (error) {
                console.log("No additional uploaded image found.");
                document.getElementById('uploadSection').style.display = 'block';
            }

            try {
                // Retrieve sales data from Firestore
                const docRef = doc(db, "report", documentId);
                const docSnap = await getDoc(docRef);
                console.log("dd")

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
        } else {
            console.log("User is not signed in.");
        }
    });
}

async function uploadImage1(file) {
    const user = auth.currentUser;
    if (user) {
        const documentId = user.displayName;
        const imageRef = ref(storage, `profileImages/${documentId}.jpg`);

        try {
            await uploadBytes(imageRef, file);

            // Get and display the new image URL
            const imageUrl = await getDownloadURL(imageRef);
            document.getElementById('profileImage').src = imageUrl;
            document.getElementById('profileImage').style.display = 'block';

            // Hide upload section after a successful upload
            document.getElementById('profileUploadSection').style.display = 'none';
            document.getElementById('editProfileImageButton').style.display = 'inline';
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    }
}

// // Show upload section when "Edit Image" is clicked
document.getElementById('editProfileImageButton').addEventListener('click', () => {
    alert("Please upload an image with your username. e.g. '<username>.jpg'");
    document.getElementById('profileUploadSection').style.display = 'block';
});

// Handle image upload
document.getElementById('uploadProfileButton').addEventListener('click', () => {
    const file = document.getElementById('profileImageUpload').files[0];
    if (file) {
        uploadImage1(file);
    } else {
        alert("Please select an image to upload.");
    }
});

//







async function uploadImage(file) {
    const user = auth.currentUser;
    if (user) {
        const documentId = user.displayName;
        const imageRef = ref(storage, `additionalImages/${documentId}.jpg`);

        try {
            await uploadBytes(imageRef, file);

            // Get and display the new image URL
            const imageUrl = await getDownloadURL(imageRef);
            document.getElementById('uploadedImage').src = imageUrl;
            document.getElementById('uploadedImage').style.display = 'block';

            // Hide upload section after a successful upload
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('editImageButton').style.display = 'inline';
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    }
}

// Show upload section when "Edit Image" is clicked
document.getElementById('editImageButton').addEventListener('click', () => {
    document.getElementById('uploadSection').style.display = 'block';
});

// Handle image upload
document.getElementById('uploadButton').addEventListener('click', () => {
    const file = document.getElementById('imageUpload').files[0];
    if (file) {
        uploadImage(file);
    } else {
        alert("Please select an image to upload.");
    }
});

// Load data on page load
fetchData();
