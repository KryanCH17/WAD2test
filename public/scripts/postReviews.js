import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Initialize Firebase
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


// Firebase initialization (ensure it's already initialized in your app)
const auth = getAuth();
const db = getFirestore();


// Load reviews for a specific post
export async function loadReviews(postId, postData) {
    const reviewsList = document.getElementById("reviews-list");
    reviewsList.textContent = ""; // Clear any previous reviews

    const reviewsSnapshot = await getDocs(collection(db, `posts/${postId}/reviews`));

    if (reviewsSnapshot.empty) {
        const noReviewsMessage = document.createElement("p");
        noReviewsMessage.textContent = "No reviews yet. Be the first to leave a review!";
        reviewsList.appendChild(noReviewsMessage);
    }

    reviewsSnapshot.forEach((doc) => {
        const reviewData = doc.data();
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review");

        // Create and append the review elements
        const username = document.createElement("div");
        username.classList.add("review-username");
        username.textContent = reviewData.account;

        const rating = document.createElement("div");
        rating.classList.add("review-rating");
        rating.textContent = `Rating: ${"★".repeat(reviewData.starRating)}`;

        const reviewText = document.createElement("div");
        reviewText.classList.add("review-text");
        reviewText.textContent = reviewData.reviewText;

        reviewElement.appendChild(username);
        reviewElement.appendChild(rating);
        reviewElement.appendChild(reviewText);


        // Add edit/delete buttons if the current user is the review author
        onAuthStateChanged(auth, (user) => {
            if (user && user.uid === reviewData.userId) {
                const buttonsContainer = document.createElement("div");
                buttonsContainer.classList.add("rev-buttons-container");

                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.classList.add("btn", "btn-secondary");
                editButton.addEventListener("click", () => editReview(doc.id, postId, reviewData, postData));

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.classList.add("btn", "btn-danger");
                deleteButton.addEventListener("click", () => deleteReview(doc.id, postId, reviewData, postData));

                buttonsContainer.append(editButton, deleteButton);
                reviewElement.appendChild(buttonsContainer);
            }
        });

        reviewsList.appendChild(reviewElement);
    });
}

// Submit a review for a post
export async function submitReview(postId, reviewText, starRating, postData) {
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to submit a review.");
        return;
    }

    const userDisplayName = user.displayName || "Anonymous";

    try {
        await addDoc(collection(db, `posts/${postId}/reviews`), {
            reviewText: reviewText,
            account: userDisplayName,
            userId: user.uid,
            starRating: starRating,
            timestamp: new Date(),
        });
        alert("Review submitted successfully!");
        console.log(postData.uid);

        // Update the report based on the star rating
        if (starRating >= 4) {
            await addGood(starRating, postData.uid);
        } else if (starRating === 3) {
            await addNeutral(starRating, postData.uid);
        } else {
            await addBad(starRating, postData.uid);
        }

        loadReviews(postId, postData);  // Reload reviews after submission
    } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review.");
    }
}

// Edit a review for a post
export async function editReview(reviewId, postId, reviewData, postData) {
    const newReviewText = prompt("Edit your review:", reviewData.reviewText);
    const newRating = prompt("Edit your rating (1-5):", reviewData.starRating);

    if (newReviewText && newRating) {
        await updateReview(reviewId, postId, newReviewText, parseInt(newRating, 10), postData);
    }
}

// Update the review in Firestore
async function updateReview(reviewId, postId, reviewText, starRating, postData) {
    let oldStarRating;
    try {
        const reviewRef = doc(db, `posts/${postId}/reviews`, reviewId);

        // Retrieve the current review document to get the existing starRating
        const reviewSnap = await getDoc(reviewRef);

        if (reviewSnap.exists()) {
            const currentReviewData = reviewSnap.data();
            oldStarRating = currentReviewData.starRating;
        }
    } catch (error) {
        console.error("Error retrieving review:", error);
    }
    try {
        await updateDoc(doc(db, `posts/${postId}/reviews`, reviewId), {
            reviewText: reviewText,
            starRating: starRating,
            timestamp: new Date(),
        });
        alert("Review updated successfully!");
        if (oldStarRating != starRating) {
            updateRating(oldStarRating, starRating, postData.uid);
        }
        loadReviews(postId, postData);  // Reload reviews after updating
    } catch (error) {
        console.error("Error updating review:", error);
        alert("Failed to update review.");
    }
}

// Delete a review from a post
export async function deleteReview(reviewId, postId, reviewData, postData) {
    if (confirm("Are you sure you want to delete this review?")) {
        try {
            await deleteDoc(doc(db, `posts/${postId}/reviews`, reviewId));
            alert("Review deleted successfully!");
            deleteRating(reviewData.starRating, postData.uid);
            loadReviews(postId, postData);  // Reload reviews after deleting
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    }
}

// Function to set up review form for authenticated users
// Function to set up review form for authenticated users
export function setupReviewForm(postId, postData) {
    const reviewFormContainer = document.getElementById("review-input-section");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Get the post data to check the post creator
            const postRef = doc(db, "posts", postId);
            getDoc(postRef).then(postSnap => {
                if (postSnap.exists()) {
                    const postData = postSnap.data();
                    const postCreatorId = postData.uid;  // The UID of the post creator

                    // If the current user is the post creator, hide the review form
                    if (user.uid === postCreatorId) {
                        const warningMessage = document.createElement("p");
                        warningMessage.classList.add("alert", "alert-warning");
                        warningMessage.textContent = "You cannot leave a review for your own post.";
                        reviewFormContainer.appendChild(warningMessage);
                    } else {
                        // Show the review form if the user is not the post creator
                        const reviewTextArea = document.createElement("textarea");
                        reviewTextArea.id = "review-text";
                        reviewTextArea.classList.add("form-control");
                        reviewTextArea.rows = 3;
                        reviewTextArea.placeholder = "Write your review here...";

                        const stars = document.createElement("span");
                        stars.innerText = "Stars (rate from 1 to 5): ";

                        const reviewStar = document.createElement("select");
                        reviewStar.id = "review-star";
                        reviewStar.classList.add("form-control", "mt-2");

                        for (let i = 1; i <= 5; i++) {
                            const option = document.createElement("option");
                            option.value = i;
                            option.textContent = i;
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

                        submitButton.addEventListener("click", () => {
                            const reviewText = reviewTextArea.value;
                            const starRating = parseInt(reviewStar.value);
                            submitReview(postId, reviewText, starRating, postData);  // Submit review
                            reviewTextArea.value = "";
                            reviewStar.value = "1";
                        });
                    }
                }
            }).catch(error => {
                console.error("Error fetching post data:", error);
            });
        } else {
            const warningMessage = document.createElement("p");
            warningMessage.classList.add("alert", "alert-warning");
            warningMessage.textContent = "You must be logged in to leave a review.";
            reviewFormContainer.appendChild(warningMessage);
        }
    });
}




async function addGood(starRating, account) {
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


async function addBad(starRating, account) {
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


async function addNeutral(starRating, account) {
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

async function updateRating(oldStarRating, starRating, account) {
    const reportDocRef = doc(db, "report", account); // Reference to your document

    try {
        // Fetch the current document
        const docSnap = await getDoc(reportDocRef);
        console.log("found");

        if (docSnap.exists()) {
            // Get the current value of a specific field
            const currentStars = docSnap.data().total_stars || 0;
            const currentBad = docSnap.data().bad || 0;
            const currentGood = docSnap.data().good || 0;
            console.log("founded");

            if (oldStarRating > starRating) {
                console.log("foundfounded");
                if (oldStarRating > 3 && starRating == 3) {
                    await updateDoc(reportDocRef, {
                        good: currentGood - 1,
                        total_stars: currentStars - (oldStarRating - starRating)
                    });
                }
                if (oldStarRating == 3 && starRating < 3) {
                    await updateDoc(reportDocRef, {
                        bad: currentBad + 1,
                        total_stars: currentStars - (oldStarRating - starRating)
                    });
                }
                if (oldStarRating == 3 && starRating > 3) {
                    await updateDoc(reportDocRef, {
                        good: currentGood + 1,
                        total_stars: currentStars - (oldStarRating - starRating)
                    });
                }
                if (oldStarRating > 3 && starRating < 3) {
                    console.log("working right");
                    await updateDoc(reportDocRef, {
                        bad: currentBad + 1,
                        good: currentGood - 1,
                        total_stars: currentStars - (oldStarRating - starRating)
                    });
                }
            } else {
                console.log("foundfounded");
                if (starRating > 3 && oldStarRating == 3) {
                    await updateDoc(reportDocRef, {
                        good: currentGood + 1,
                        total_stars: currentStars + (starRating - oldStarRating)
                    });
                }
                if (starRating == 3 && oldStarRating < 3) {
                    await updateDoc(reportDocRef, {
                        bad: currentBad - 1,
                        total_stars: currentStars + (starRating - oldStarRating)
                    });
                }
                if (starRating == 3 && oldStarRating > 3) {
                    await updateDoc(reportDocRef, {
                        good: currentGood - 1,
                        total_stars: currentStars + (starRating - oldStarRating)
                    });
                }

                if (starRating > 3 && oldStarRating < 3) {
                    await updateDoc(reportDocRef, {
                        bad: currentBad - 1,
                        good: currentGood + 1,
                        total_stars: currentStars + (starRating - oldStarRating)
                    });
                }
            }
            console.log("Field updated successfully!");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

async function deleteRating(starRating, account) {
    const reportDocRef = doc(db, "report", account); // Reference to your document

    try {
        // Fetch the current document
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists()) {
            // Get the current value of a specific field
            const currentReviews = docSnap.data().reviews || 0;
            const currentStars = docSnap.data().total_stars || 0;
            const currentBad = docSnap.data().bad || 0;
            const currentGood = docSnap.data().good || 0;
            console.log("checking");

            if (starRating > 3) {
                await updateDoc(reportDocRef, {
                    reviews: currentReviews - 1,
                    good: currentGood - 1,
                    total_stars: currentStars - starRating
                });
            }
            if (starRating == 3) {
                await updateDoc(reportDocRef, {
                    reviews: currentReviews - 1,
                    total_stars: currentStars - starRating
                });
            }
            if (starRating < 3) {
                await updateDoc(reportDocRef, {
                    reviews: currentReviews - 1,
                    bad: currrentBad - 1,
                    total_stars: currentStars - starRating
                });
            }

            console.log("Field updated successfully!");
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}