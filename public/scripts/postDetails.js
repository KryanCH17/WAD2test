import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";

// Import review-related functions from postReviews.js
import { loadReviews, setupReviewForm } from './postReviews.js';  // Make sure the path is correct

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

// Initialize Firebase if it hasn’t been initialized already
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase
const auth = getAuth();
const db = getFirestore();

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;  // Assuming you're using this for maps

// Function to retrieve and display post details
async function displayPostDetails() {
    const postDetailsContainer = document.getElementById('post-details');

    if (!postId) {
        postDetailsContainer.textContent = "Post not found.";
        return;
    }

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        postDetailsContainer.textContent = "No such post exists.";
        return;
    }

    const postData = postSnap.data();
    renderPostDetails(postDetailsContainer, postData);
    loadReviews(postId, postData); // Load reviews for the post
    setupReviewForm(postId, postData); // Set up review form for the post

    // Check if the current user is the post creator and hide the "Add to Cart" button if so
    onAuthStateChanged(auth, (user) => {
        if (user && user.uid === postData.uid) {
            // Hide the Add to Cart button if the user is the post creator
            const addToCartButton = document.getElementById("addToCartButton");
            if (addToCartButton) {
                addToCartButton.style.display = "none"; // Hide the button
            }
        }
    });
}

// Function to render post details
function renderPostDetails(container, postData) {
    const title = container.querySelector(".post-title");
    title.textContent = postData.itemName;

    const description = container.querySelector(".post-description");
    description.textContent = "Description: ";
    const descriptionContent = document.createElement("span");
    descriptionContent.classList.add("editable-content");
    descriptionContent.textContent = postData.postDescription;
    description.appendChild(descriptionContent);

    const category = container.querySelector(".post-category");
    category.textContent = "Category: ";
    const categoryContent = document.createElement("span");
    categoryContent.classList.add("editable-content");
    categoryContent.textContent = postData.category;
    category.appendChild(categoryContent);

    const price = container.querySelector(".post-price");
    price.textContent = `Price: SGD ${postData.price}`;
    const account = container.querySelector(".post-account");
    account.textContent = `Posted by: ${postData.account}`;
    const image = container.querySelector(".post-image");
    image.src = postData.imageUrl;
    image.alt = postData.itemName;

    const addToCartButton = document.getElementById("addToCartButton");
    if (addToCartButton) {
        addToCartButton.addEventListener("click", () => addToCart(postData)); // Ensure this function exists and is added here
    }

    if (postData.mrtStationName) {
        loadGoogleMapsScript(postData.mrtStationName);
    }

    onAuthStateChanged(auth, (user) => {
        if (user && user.uid === postData.uid) {
            addEditAndDeleteOptions();  // Allow edit and delete options if user is the post creator
        }
    });
}

// Google Maps loading function
function loadGoogleMapsScript(locationName) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMapWithGeocoding`;
    script.async = true;
    document.head.appendChild(script);

    window.initMapWithGeocoding = function () {
        initMapWithGeocoding(locationName);
    };
}

// Initialize map with geocoding location name
function initMapWithGeocoding(locationName) {
    const mapContainer = document.getElementById("map");
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: locationName }, (results, status) => {
        if (status === "OK" && results.length > 0) {
            const { lat, lng } = results[0].geometry.location;
            const mapOptions = {
                center: { lat: lat(), lng: lng() },
                zoom: 15
            };
            const map = new google.maps.Map(mapContainer, mapOptions);
            new google.maps.Marker({
                position: { lat: lat(), lng: lng() },
                map: map,
                title: locationName
            });
        } else {
            mapContainer.textContent = "Location not found.";
        }
    });
}

// Add edit, delete, and save buttons below the map
function addEditAndDeleteOptions() {
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-container");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit Post";
    editButton.classList.add("btn", "btn-warning");
    editButton.addEventListener("click", enableEditing);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Post";
    deleteButton.classList.add("btn", "btn-danger");
    deleteButton.addEventListener("click", () => deletePost(postId));

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Changes";
    saveButton.classList.add("btn", "btn-success");
    saveButton.style.display = "none";  // Initially hidden
    saveButton.addEventListener("click", savePostChanges);

    buttonsContainer.append(editButton, deleteButton, saveButton);

    const mapContainer = document.getElementById("map");
    mapContainer.insertAdjacentElement("afterend", buttonsContainer);
    buttonsContainer.saveButton = saveButton;
}

// Enable or disable editing for the content
function enableEditing() {
    const title = document.querySelector(".post-title");
    const descriptionContent = document.querySelector(".post-description .editable-content");
    const categoryContent = document.querySelector(".post-category .editable-content");

    // Make title and description editable
    title.contentEditable = "true";
    descriptionContent.contentEditable = "true";
    title.classList.add("editable-field");
    descriptionContent.classList.add("editable-field");

    // Replace category text with a dropdown
    const categoryDropdown = document.createElement("select");
    categoryDropdown.classList.add("category-dropdown");
    const categories = ["Crafts", "Fashion", "Food", "Services"]; // Existing categories

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        if (category === categoryContent.textContent) {
            option.selected = true; // Set the current category as selected
        }
        categoryDropdown.appendChild(option);
    });

    // Replace the category content with the dropdown
    categoryContent.replaceWith(categoryDropdown);

    const addToCartButton = document.getElementById("addToCartButton");
    if (addToCartButton) {
        addToCartButton.style.display = "none";  // Hide Add to Cart button while editing
    }

    // Show save button
    const buttonsContainer = document.querySelector(".buttons-container");
    buttonsContainer.saveButton.style.display = "inline-block";
}

// Function to save the post changes (title, description, and category)
async function savePostChanges() {
    const title = document.querySelector(".post-title");
    const descriptionContent = document.querySelector(".post-description .editable-content");
    const categoryDropdown = document.querySelector(".post-category .category-dropdown");

    try {
        await updateDoc(doc(db, "posts", postId), {
            itemName: title.textContent,
            postDescription: descriptionContent.textContent,
            category: categoryDropdown.value,  // Get the selected category from the dropdown
        });

        alert("Post updated successfully!");
        location.reload();  // Reload the page to reflect changes
    } catch (error) {
        console.error("Error updating post:", error);
        alert("Failed to update post.");
    }
}

// Function to delete the post
async function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            document.getElementById('post-details').textContent = "Post has been deleted.";
            setTimeout(() => window.location.href = "/userPosts.html", 2000);
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post.");
        }
    }
}

// Initialize display of post details on page load
window.onload = displayPostDetails;

async function addToCart(postData) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const cartRef = collection(db, `users/${user.uid}/cart`);
                const cartSnapshot = await getDocs(cartRef);
                let existingItemDoc = null;

                // Check if the item already exists in the cart
                cartSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.itemId === postId) {
                        existingItemDoc = doc; // Store the document reference if the item is found
                    }
                });

                if (existingItemDoc) {
                    // Item exists in the cart, update the quantity and total price
                    const newQuantity = existingItemDoc.data().quantity + 1; // Increase quantity
                    const newTotalPrice = postData.price * newQuantity; // Update total price

                    await updateDoc(doc(db, `users/${user.uid}/cart`, existingItemDoc.id), {
                        quantity: newQuantity,
                        totalPrice: newTotalPrice // Store the updated total price
                    });
                    alert("Item quantity updated in cart!");
                } else {
                    // Item does not exist, add it to the cart
                    await addDoc(cartRef, {
                        itemId: postId,
                        itemName: postData.itemName,
                        itemPrice: postData.price,
                        itemImage: postData.imageUrl,
                        account: postData.account,
                        sellerUid: postData.uid,
                        quantity: 1, // Start with quantity of 1
                        totalPrice: postData.price, // Store initial total price
                        timestamp: new Date()
                    });
                    alert("Item added to cart!");
                }
            } catch (error) {
                console.error("Error adding to cart:", error);
            }
        } else {
            window.location.href = "/login.html";
        }
    });
}
