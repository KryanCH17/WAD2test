import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import getAuth and onAuthStateChanged
import { getFirestore, collection, getDocs, query, orderBy, where } from "firebase/firestore";

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

const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Auth
let allPosts = []; // Array to store all posts

// Function to retrieve posts from Firestore
async function retrievePosts() {
    const postsContainer = document.getElementById('posts-container');

    // Clear container and reset posts array
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }
    allPosts = [];

    try {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const postData = doc.data();
            postData.id = doc.id; // Add the document ID to the post data
            allPosts.push(postData); // Add to the allPosts array
            displayPost(postData, postsContainer);
        });

        if (allPosts.length === 0) {
            const noPostsMessage = document.createElement('p');
            noPostsMessage.textContent = "No posts available.";
            postsContainer.appendChild(noPostsMessage);
        }
    } catch (error) {
        console.error("Error retrieving posts:", error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = "Failed to load posts. Please try again later.";
        postsContainer.appendChild(errorMessage);
    }
}

function displayPost(postData, container) {
    if (!postData.itemName || !postData.imageUrl || !postData.account) {
        console.warn("Incomplete post data:", postData);
        return;
    }

    const postElement = document.createElement('div');
    postElement.classList.add('post-item');
    postElement.setAttribute('data-category', postData.category || "Uncategorized");

    const itemName = document.createElement('h3');
    itemName.textContent = postData.itemName;

    const account = document.createElement('p');
    account.textContent = "Posted by: ";

    const accountLink = document.createElement('a');
    accountLink.textContent = postData.account; // Only the account name is clickable
    accountLink.classList.add('account-link');

    // Check if the post belongs to the logged-in user
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const loggedInAccount = user.displayName; 

            if (postData.account === loggedInAccount) {
                accountLink.href = `/mymarketplace.html`;
            } else {
                accountLink.href = `usermarketplace.html?account=${encodeURIComponent(postData.account)}`;
            }
        } else {
            accountLink.href = `usermarketplace.html?account=${encodeURIComponent(postData.account)}`;
        }
    });

    account.appendChild(accountLink); // Append the link to the paragraph

    const moreDetailsButton = document.createElement('button');
    moreDetailsButton.textContent = "More Details";
    moreDetailsButton.classList.add('more-details');
    moreDetailsButton.addEventListener('click', () => {
        window.location.href = `postDetails.html?id=${postData.id}`;
    });

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');

    const image = document.createElement('img');
    image.src = postData.imageUrl;
    image.alt = postData.itemName;
    image.classList.add('post-image');

    imageContainer.appendChild(image);

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');
    contentContainer.appendChild(itemName);
    contentContainer.appendChild(account);
    contentContainer.appendChild(moreDetailsButton);

    postElement.appendChild(imageContainer);
    postElement.appendChild(contentContainer);

    container.appendChild(postElement);
}

// Function to filter posts based on the selected category
function filterPosts(category) {
    const postsContainer = document.getElementById('posts-container');
    const filteredPosts = category === "All" 
        ? allPosts // Show all posts if "All" is selected
        : allPosts.filter(post => post.category === category);

    // Clear existing posts
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }

    // Display filtered posts
    filteredPosts.forEach(post => displayPost(post, postsContainer));

    // If no posts match the selected category, display a message
    if (filteredPosts.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = `No posts found in the "${category}" category.`;
        postsContainer.appendChild(noResultsMessage);
    }
}

// Search and filter posts based on the search query
function searchPosts(query) {
    const postsContainer = document.getElementById('posts-container');
    const filteredPosts = allPosts.filter(post => 
        post.itemName.toLowerCase().includes(query.toLowerCase()) || 
        post.account.toLowerCase().includes(query.toLowerCase())
    );

    const currentCategory = document.querySelector('.active-filter') ? document.querySelector('.active-filter').textContent : 'All';

    // If a category is selected, filter by it as well
    const finalFilteredPosts = currentCategory === 'All' 
        ? filteredPosts 
        : filteredPosts.filter(post => post.category === currentCategory);

    // Clear existing posts
    while (postsContainer.firstChild) {
        postsContainer.removeChild(postsContainer.firstChild);
    }

    // Display filtered posts
    finalFilteredPosts.forEach(post => displayPost(post, postsContainer));

    // If no posts match the search query, display a message
    if (finalFilteredPosts.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = "No posts found for your search.";
        postsContainer.appendChild(noResultsMessage);
    }
}

// Event listeners for filter buttons
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.textContent;
            filterPosts(category); // Call filterPosts to filter posts by category
            filterButtons.forEach(btn => btn.classList.remove('active')); // Remove active class from all buttons
            button.classList.add('active'); // Add active class to clicked button
        });
    });

    const searchInput = document.getElementById('search-input'); // Ensure you have an input field with this ID
    searchInput.addEventListener('input', (event) => {
        const searchQuery = event.target.value;
        searchPosts(searchQuery); // Call searchPosts when the user types in the search field
    });

    // Call the function to retrieve and display the posts when the page loads
    retrievePosts();
});
