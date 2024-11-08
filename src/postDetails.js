import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc, deleteDoc, updateDoc, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_DATABASE_URL,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

// Google Maps API key from .env file
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Function to add item to cart
async function addToCart(postData) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const cartRef = collection(db, `users/${user.uid}/cart`);
                await addDoc(cartRef, {
                    itemId: postId,
                    itemName: postData.itemName,
                    itemPrice: postData.price,
                    itemImage: postData.imageUrl,
                    account: postData.account,
                    timestamp: new Date()
                });
                alert("Item added to cart!");
            } catch (error) {
                console.error("Error adding to cart:", error);
            }
        } else {
            window.location.href = "/login.html";
        }
    });
}

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
    loadReviews(postId);
    setupReviewForm(postData);
}

// Function to render post details and add the Add to Cart button
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

    const categoryDropdown = document.createElement("select");
    categoryDropdown.classList.add("category-dropdown");
    categoryDropdown.style.display = "none"; // Initially hidden
    ["Crafts", "Fashion", "Food", "Services"].forEach(optionText => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        if (postData.category === optionText) {
            option.selected = true;
        }
        categoryDropdown.appendChild(option);
    });
    category.appendChild(categoryDropdown);

    const price = container.querySelector(".post-price");
    price.textContent = `Price: SGD ${postData.price}`;

    const account = container.querySelector(".post-account");
    account.textContent = `Posted by: ${postData.account}`;

    const image = container.querySelector(".post-image");
    image.src = postData.imageUrl;
    image.alt = postData.itemName;

    const addToCartButton = document.getElementById("addToCartButton");
    if (addToCartButton) {
        addToCartButton.addEventListener("click", () => addToCart(postData));
    }

    if (postData.mrtStationName) {
        loadGoogleMapsScript(postData.mrtStationName);
    }

    onAuthStateChanged(auth, (user) => {
        if (user && user.uid === postData.uid) {
            addEditAndDeleteOptions();
        }
    });
}

// Load Google Maps script with API key and initialize map with location name
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

// Add edit, delete, and save buttons at the end of the review section
function addEditAndDeleteOptions() {
    const reviewFormContainer = document.getElementById("review-input-section");

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
    saveButton.style.display = "none";
    saveButton.addEventListener("click", () => savePostChanges(postId));

    buttonsContainer.append(editButton, deleteButton, saveButton);
    reviewFormContainer.insertAdjacentElement("afterend", buttonsContainer);

    buttonsContainer.saveButton = saveButton;
}

// Enable editing for post details and show Save button
function enableEditing() {
    const title = document.querySelector(".post-title");
    const descriptionContent = document.querySelector(".post-description .editable-content");
    const categoryContent = document.querySelector(".post-category .editable-content");
    const categoryDropdown = document.querySelector(".post-category .category-dropdown");
    const price = document.querySelector(".post-price");

    [title, descriptionContent, price].forEach(field => {
        field.contentEditable = "true";
        field.classList.add("editable-field"); // Add the editable-field class
    });

    categoryContent.style.display = "none"; // Hide the text content
    categoryDropdown.style.display = "inline-block"; // Show the dropdown
    categoryDropdown.disabled = false;

    const addToCartButton = document.getElementById("addToCartButton");
    if (addToCartButton) {
        addToCartButton.style.display = "none";
    }

    const buttonsContainer = document.querySelector(".buttons-container");
    buttonsContainer.saveButton.style.display = "inline-block";
}

// Save changes to post details
async function savePostChanges(postId) {
    const title = document.querySelector(".post-title");
    const descriptionContent = document.querySelector(".post-description .editable-content");
    const categoryDropdown = document.querySelector(".post-category .category-dropdown");
    const price = document.querySelector(".post-price");

    const priceText = price.textContent.replace(/[^\d.-]/g, "");
    const priceValue = parseFloat(priceText);

    if (isNaN(priceValue)) {
        alert("Invalid price. Please enter a numeric value.");
        return;
    }

    try {
        await updateDoc(doc(db, "posts", postId), {
            itemName: title.textContent,
            postDescription: descriptionContent.textContent,
            category: categoryDropdown.value,
            price: priceValue
        });
        alert("Post updated successfully!");
        location.reload();

        [title, descriptionContent, price].forEach(field => {
            field.classList.remove("editable-field");
            field.contentEditable = "false";
        });

        document.querySelector(".post-category .editable-content").style.display = "inline";
        categoryDropdown.style.display = "none";
        categoryDropdown.disabled = true;
    } catch (error) {
        console.error("Error updating post:", error);
        alert("Failed to update post.");
    }
}

// Delete the post with confirmation
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

// review
async function loadReviews(postId) {
    const reviewsList = document.getElementById("reviews-list");
    reviewsList.textContent = "";

    const reviewsSnapshot = await getDocs(collection(db, `posts/${postId}/reviews`));
    const user = auth.currentUser;

    reviewsSnapshot.forEach((doc) => {
        const reviewData = doc.data();
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review");
        reviewElement.textContent = `${reviewData.account} - ${"★".repeat(reviewData.starRating)}: ${reviewData.reviewText}`;

        // Append the username, rating, and review text to the review element
        reviewElement.appendChild(username);
        reviewElement.appendChild(rating);
        reviewElement.appendChild(reviewText);

        // Buttons for edit and delete
        if (user && user.uid === reviewData.userId) {
            const revbuttonsContainer = document.createElement("div");
            revbuttonsContainer.classList.add("rev-buttons-container");

            const editReviewButton = document.createElement("button");
            editReviewButton.textContent = "Edit";
            editReviewButton.classList.add("btn", "btn-secondary");
            editReviewButton.addEventListener("click", () => editReview(doc.id, postId, reviewData));

            const deleteReviewButton = document.createElement("button");
            deleteReviewButton.textContent = "Delete";
            deleteReviewButton.classList.add("btn", "btn-danger");
            deleteReviewButton.addEventListener("click", () => deleteReview(doc.id, postId)); // Pass review ID and post ID to delete function
            reviewElement.appendChild(deleteReviewButton); // Add delete button to the review
        }

        reviewsList.appendChild(reviewElement); // Append the review element to the list
    });
}


// Function to submit a review
async function submitReview(postId, reviewText, starRating, account) {
    const user = auth.currentUser; // Get the current user
    const userDisplayName = user.displayName || "Anonymous";
    try {
        await addDoc(collection(db, `posts/${postId}/reviews`), {
            reviewText: reviewText,
            rating: rating,
            account: userDisplayName,
            userId: user.uid, // Store the user's UID with the review
            starRating: starRating,
            timestamp: new Date()
        });
        // Update the report based on the star rating
        if (starRating >= 4) {
            await updateGood(starRating, account);
        } else if (starRating === 3) {
            await updateNeutral(starRating, account);
        } else {
            await updateBad(starRating, account);
        }

        loadReviews(postId);
    } catch (error) {
        console.error("Error adding review:", error);
        alert("Failed to add review.");
    }
}

// Edit review function to enable editing of review and rating
function editReview(reviewId, postId, reviewData) {
    const reviewText = prompt("Edit your review:", reviewData.reviewText);
    const rating = prompt("Edit your rating (1-5):", reviewData.rating);

    if (reviewText && rating) {
        updateReview(reviewId, postId, reviewText, parseInt(rating, 10));
    }
}

// Function to update a review in Firestore
async function updateReview(reviewId, postId, reviewText, rating) {
    try {
        await updateDoc(doc(db, `posts/${postId}/reviews`, reviewId), {
            reviewText: reviewText,
            rating: rating,
            timestamp: new Date()
        });
        alert("Review updated successfully!");
        loadReviews(postId);
    } catch (error) {
        console.error("Error updating review:", error);
        alert("Failed to update review.");
    }
}

// Delete the review with confirmation
async function deleteReview(reviewId, postId) {
    if (confirm("Are you sure you want to delete this review?")) {
        try {
            await deleteDoc(doc(db, `posts/${postId}/reviews`, reviewId));
            loadReviews(postId);
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    }
}

// Set up review submission only for authenticated users
function setupReviewForm(postData) {
    const reviewFormContainer = document.getElementById("review-input-section");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const reviewTextArea = document.createElement("textarea");
            reviewTextArea.id = "review-text";
            reviewTextArea.classList.add("form-control");
            reviewTextArea.rows = 3;
            reviewTextArea.placeholder = "Write your review here...";

            const stars = document.createElement("span");
            stars.innerText = "Stars (rate from 1 to 5): "

            const reviewStar = document.createElement("select");
            reviewStar.id = "review-star";
            reviewStar.classList.add("form-control", "mt-2");

            // Adding options 1 to 5 in the dropdown
            for (let i = 1; i <= 5; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i;
                if (i === 5) {
                    option.selected = true;
                }
                reviewStar.appendChild(option);
            }


            const submitButton = document.createElement("button");
            submitButton.id = "submit-review";
            submitButton.classList.add("btn", "btn-primary", "mt-2");
            submitButton.textContent = "Submit Review";

            reviewFormContainer.appendChild(reviewTextArea);
            reviewFormContainer.appendChild(stars);
            reviewFormContainer.appendChild(reviewStar);
            reviewFormContainer.appendChild(submitButton);

            submitButton.addEventListener("click", async () => {
                console.log("working review");
                const reviewText = reviewTextArea.value;
                const reviewStarValue = parseInt(reviewStar.value); // Convert star rating to an integer

                if (reviewText.trim()) {
                    await submitReview(postId, reviewText, reviewStarValue, postData.account); // Pass the star rating to `submitReview`
                    reviewTextArea.value = "";
                }
            });
        } else {
            const warningMessage = document.createElement("p");
            warningMessage.classList.add("alert", "alert-warning");
            warningMessage.textContent = "You must be logged in to leave a review.";
            reviewFormContainer.appendChild(warningMessage);
        }
    });
}

// Function to get current value, modify it, and update the document
async function updateGood(starRating, account) {
    const reportDocRef = doc(db, "report", account); // Reference to your document

    try {
        // Fetch the current document
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
            // Get the current value of a specific field
            const currentReviews = docSnap.data().reviews || 0;
            const currentGood = docSnap.data().good || 0;
            const currentStars = docSnap.data().total_stars || 0;

            // Update the field by incrementing it, for example
            await updateDoc(reportDocRef, {
                reviews: currentReviews + 1, // Increment the sales field
                good: currentGood + 1,
                total_stars: currentStars + starRating
            });

            console.log("Field updated successfully!");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}


async function updateBad(starRating, account) {
    const reportDocRef = doc(db, "report", account); // Reference to your document

    try {
        // Fetch the current document
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
            // Get the current value of a specific field
            const currentReviews = docSnap.data().reviews || 0;
            const currentBad = docSnap.data().bad || 0;
            const currentStars = docSnap.data().total_stars || 0;

            // Update the field by incrementing it, for example
            await updateDoc(reportDocRef, {
                reviews: currentReviews + 1,
                bad: currentBad + 1,
                total_stars: currentStars + starRating
            });

            console.log("Field updated successfully!");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}


async function updateNeutral(starRating, account) {
    const reportDocRef = doc(db, "report", account); // Reference to your document

    try {
        // Fetch the current document
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
            // Get the current value of a specific field
            const currentReviews = docSnap.data().reviews || 0;
            const currentStars = docSnap.data().total_stars || 0;

            // Update the field by incrementing it, for example
            await updateDoc(reportDocRef, {
                reviews: currentReviews + 1,
                total_stars: currentStars + starRating
            });

            console.log("Field updated successfully!");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

// Initialize display of post details on page load
window.onload = displayPostDetails;
