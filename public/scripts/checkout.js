import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, deleteDoc, doc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

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

// Firebase setup
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Fetch seller UIDs from the Firestore cart
async function fetchSellerUids(userId) {
    try {
        const cartRef = collection(db, `users/${userId}/cart`);
        const cartSnapshot = await getDocs(cartRef);

        const sellerUids = new Set(); // Using a Set to avoid duplicates

        cartSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.sellerUid) {
                sellerUids.add(data.sellerUid); // Add sellerUid to the set
            }
        });

        // Log the fetched seller UIDs to the console
        console.log("Fetched seller UIDs:", Array.from(sellerUids));

        return Array.from(sellerUids); // Convert Set to Array
    } catch (error) {
        console.error("Error fetching seller UIDs:", error);
        return []; // Return an empty array in case of an error
    }
}

async function fetchSeller(userId) {
    try {
        const cartRef = collection(db, `users/${userId}/cart`);
        const cartSnapshot = await getDocs(cartRef);

        const seller = new Set(); // Using a Set to avoid duplicates

        cartSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(data);
            if (data.account) {
                seller.add(data.account); // Add sellerUid to the set
            }
        });

        // Log the fetched seller UIDs to the console
        //console.log("Fetched seller UIDs:", Array.from(sellerUids));

        return Array.from(seller); // Convert Set to Array
    } catch (error) {
        console.error("Error fetching seller UIDs:", error);
        return []; // Return an empty array in case of an error
    }
}

async function fetchPrice(userId) {
    try {
        const cartRef = collection(db, `users/${userId}/cart`);
        const cartSnapshot = await getDocs(cartRef);

        const price = new Set(); // Using a Set to avoid duplicates

        cartSnapshot.forEach(doc => {
            const data = doc.data();
            // console.log(data);
            if (data.totalPrice) {
                price.add(data.totalPrice); // Add sellerUid to the set
            }
        });

        // Log the fetched seller UIDs to the console
        //console.log("Fetched seller UIDs:", Array.from(sellerUids));

        return Array.from(price); // Convert Set to Array
    } catch (error) {
        console.error("Error fetching seller UIDs:", error);
        return []; // Return an empty array in case of an error
    }
}

// Fetch QR code URL for a seller from Firebase Storage
async function fetchQRCodeUrl(sellerUid) {
    try {
        // Construct the path for the QR code image in Firebase Storage
        const qrRef = ref(storage, `qrCodes/${sellerUid}`); // Assumes the QR codes are stored with the sellerUid as the filename
        const qrUrl = await getDownloadURL(qrRef); // Fetch the download URL of the QR code image
        console.log(`Fetched QR code URL for seller ${sellerUid}:`, qrUrl);
        return qrUrl;
    } catch (error) {
        console.error(`Error fetching QR code for seller ${sellerUid}:`, error);
        return null; // Return null in case of an error
    }
}

// Display seller UIDs and their corresponding QR codes on the checkout page
async function displaySellerUids(userId) {
    try {
        const sellerUids = await fetchSellerUids(userId);
        const seller = await fetchSeller(userId);
        const amount = await fetchPrice(userId);
        const uidContainer = document.getElementById("uid-container");

        if (!uidContainer) {
            console.error('UID container not found.');
            return;
        }

        // Clear existing child elements in the container
        while (uidContainer.firstChild) {
            uidContainer.removeChild(uidContainer.firstChild);
        }

        // Log the seller UIDs that will be displayed
        console.log("Displaying seller UIDs:", sellerUids);

        // Display each sellerUid and its corresponding QR code
        if (sellerUids.length > 0) {
            for (let i = 0; i < sellerUids.length; i++) {
                const qrUrl = await fetchQRCodeUrl(sellerUids[i]); // Fetch the QR code URL for each sellerUid

                // Create a container for each seller and their QR code
                const uidElement = document.createElement("div");
                const sellerText = document.createElement("p");
                sellerText.textContent = `Seller: ${seller[i]}, Price: ${amount[i]}`;
                uidElement.appendChild(sellerText);

                if (qrUrl) {
                    const qrImage = document.createElement("img");
                    qrImage.src = qrUrl;
                    qrImage.alt = `QR Code for ${seller[i]}`;
                    qrImage.classList.add("qr-code");
                    uidElement.appendChild(qrImage);
                } else {
                    const noQrMessage = document.createElement("p");
                    noQrMessage.textContent = "No QR code available for this seller. Please contact seller for more info";
                    uidElement.appendChild(noQrMessage);
                }

                uidContainer.appendChild(uidElement);
            }
            const purchaseHistoryButton = document.createElement("button");
            purchaseHistoryButton.textContent = "Go to Purchase History";
            purchaseHistoryButton.classList.add("btn", "payment");
            purchaseHistoryButton.addEventListener("click", () => {
                window.location.href = "./mypurchase.html"
            });

            const totalContainer = document.createElement("div");
            totalContainer.classList.add("payment");
            const paymentMadeButton = document.createElement("button");
            paymentMadeButton.textContent = "Payment Made";
            paymentMadeButton.classList.add("btn", "payment");
            paymentMadeButton.addEventListener("click", () => {
                deleteAllCart(userId)
                console.log("Cleared.");
                alert("Thank you for your purchase!");
                //setTimeout(window.location.href = "./mypurchase.html", 5000);
                totalContainer.appendChild(purchaseHistoryButton);
            });

            totalContainer.appendChild(paymentMadeButton);

            uidContainer.appendChild(totalContainer);
        } else {
            const messageElement = document.createElement("p");
            messageElement.textContent = "You did not purchase anything.";
            uidContainer.appendChild(messageElement);
        }
    } catch (error) {
        console.error("Error displaying seller UIDs and QR codes:", error);
    }
}

async function deleteAllCart(userId) {
    console.log(userId);
    const collectionRef = collection(db, `users/${userId}/cart`);
    const snapshot = await getDocs(collectionRef);

    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    console.log("running")
    await batch.commit();

    console.log("still running?")
    // try {
    //     await deleteDoc(cartItemRef);
    //     console.log("Item deleted successfully.");
    // } catch (error) {
    //     console.error("Error deleting item:", error);
    // }
}

// Wait for the user to be authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated:", user.uid);
        displaySellerUids(user.uid); // Display seller UIDs for the authenticated user along with their QR codes
    } else {
        console.log("User not authenticated. Redirecting to login page.");
        window.location.href = "/login.html";
    }
});
