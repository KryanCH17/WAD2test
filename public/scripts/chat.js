import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
const storage = getStorage();

let allUsers = [];

// Fetch all users and store them
async function fetchAllUsers() {
    try {
        const usersRef = collection(db, "users_chat");
        const snapshot = await getDocs(usersRef);
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadUsers();  // Load users after fetching
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Function to load users based on search term
function loadUsers(searchTerm = "") {
    const usersList = document.getElementById("user-list");

    // Clear current user list
    while (usersList.firstChild) {
        usersList.removeChild(usersList.firstChild);
    }

    const loggedInUserEmail = auth.currentUser ? auth.currentUser.email : null;

    // Store the search term in localStorage
    localStorage.setItem("searchTerm", searchTerm);

    // Filter users based on search term (case-insensitive)
    const filteredUsers = allUsers.filter(user => {
        const displayName = user.displayName || "";
        return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Display filtered users
    filteredUsers.forEach(user => {
        const { displayName, email } = user;

        // Exclude logged-in user
        if (displayName && email && email !== loggedInUserEmail) {
            const button = document.createElement("button");
            button.textContent = displayName;
            button.classList.add("user-button");

            // Add click event to open chat
            button.addEventListener("click", () => {
                openChat(user.id);
                highlightUserName(button);
            });

            usersList.appendChild(button);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const currentChatId = localStorage.getItem("currentChatId");
    const searchTerm = localStorage.getItem("searchTerm");

    if (currentChatId) {
        // Open the last opened chat
        openChatFromLocalStorage(currentChatId);
    }

    if (searchTerm) {
        // Load users with the previous search term
        loadUsers(searchTerm);
    }
});

function openChatFromLocalStorage(chatId) {
    const currentUser = auth.currentUser;
    if (currentUser) {
        // Open the chat for the user with the saved chatId
        const receiverId = chatId.split('_').find(id => id !== currentUser.uid);
        openChat(receiverId);
    }
}

// Event listener for real-time search as the user types
document.getElementById("search-bar").addEventListener("input", (event) => {
    const searchTerm = event.target.value.trim();
    loadUsers(searchTerm);  // Filter and reload users
});

// Function to highlight selected user
function highlightUserName(userButton) {
    document.querySelectorAll(".user-button").forEach(button => button.classList.remove("highlight"));
    userButton.classList.add("highlight");
}

// Chat functions
function getChatId(userId1, userId2) {
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
}

function openChat(receiverId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error("User is not authenticated.");
        return;
    }
    const chatId = getChatId(currentUser.uid, receiverId);

    localStorage.setItem("currentChatId", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesQuery = query(messagesRef, orderBy("timestamp"));

    let lastSenderId = null;
    let receiverUsername = null;

    // Fetch receiver's details
    getDoc(doc(db, "users_chat", receiverId)).then(userDoc => {
        if (userDoc.exists()) {
            const receiverData = userDoc.data();
            receiverUsername = receiverData.displayName || receiverData.email;
            const chatTitleElement = document.getElementById("chat-title");

            // Set the initial chat title
            const chatTitleText = `Chat with ${receiverUsername} today!`;

            // Initially set the chat title based on messages presence
            getDocs(messagesRef).then(messagesSnapshot => {
                if (messagesSnapshot.empty) {
                    chatTitleElement.textContent = chatTitleText;
                } else {
                    chatTitleElement.textContent = `Chatting with ${receiverUsername}`;
                }
            }).catch(error => {
                console.error("Error checking messages:", error);
            });

            // Listen for real-time updates to messages
            onSnapshot(messagesQuery, (snapshot) => {
                const messagesContainer = document.getElementById("messages-container");
                while (messagesContainer.firstChild) {
                    messagesContainer.removeChild(messagesContainer.firstChild);
                }

                // Check if there are any messages to update the chat title
                let hasMessages = false;
                snapshot.forEach((doc) => {
                    const message = { id: doc.id, ...doc.data() };  // Make sure each message includes the ID
                    const isCurrentUser = message.senderId === currentUser.uid;
                    const isContinuation = message.senderId === lastSenderId;

                    const messageElement = displayMessage(message, isCurrentUser, isContinuation, chatId);
                    messagesContainer.appendChild(messageElement);

                    lastSenderId = message.senderId;
                    hasMessages = true;  // There are messages now
                });

                // Update chat title in real-time
                if (hasMessages) {
                    chatTitleElement.textContent = `Chatting with ${receiverUsername}`;
                } else {
                    chatTitleElement.textContent = chatTitleText;
                }
            });
        }
    }).catch(error => {
        console.error("Error fetching user details:", error);
    });

    // Send message handler
    const sendButton = document.getElementById("send-button");
    sendButton.onclick = () => sendMessage(chatId);
}

// Add the right-click menu to each message element
function addContextMenu(messageElement, messageId, chatId, timestamp) {
    messageElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();

        // Format timestamp if it exists
        const formattedTimestamp = timestamp ? new Date(timestamp.seconds * 1000).toLocaleString() : "No timestamp";

        // Reference to context menu
        const menu = document.getElementById("message-menu");
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        menu.style.display = "block";

        // Set timestamp in the menu
        const timestampElement = document.getElementById("message-timestamp");
        timestampElement.textContent = `${formattedTimestamp}`;

        // Set up edit and delete options
        document.getElementById("edit-message").onclick = () => editMessage(chatId, messageId);
        document.getElementById("delete-message").onclick = () => deleteMessage(chatId, messageId);
    });
}

// Hide the menu when clicking outside
document.addEventListener("click", (event) => {
    const menu = document.getElementById("message-menu");
    if (event.target.closest("#message-menu") === null) {
        menu.style.display = "none";
    }
});

function displayMessage(message, isCurrentUser, isContinuation, chatId) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", isCurrentUser ? "user" : "other");

    // If the message has text only, display the text bubble
    if (message.text && !message.imageUrl) {
        const textElement = document.createElement("p");
        textElement.textContent = message.text;
        messageElement.appendChild(textElement);
    }

    // If the message has an image, display the image without the text bubble
    if (message.imageUrl) {
        const imageElement = document.createElement("img");
        imageElement.src = message.imageUrl;
        imageElement.classList.add("message-image");
        messageElement.appendChild(imageElement);
    }

    if (isContinuation) {
        messageElement.classList.add("continuation");
    }

    // Add context menu only to user's messages
    if (isCurrentUser) {
        addContextMenu(messageElement, message.id, chatId, message.timestamp);
    }

    return messageElement;
}

function editMessage(chatId, messageId) {
    console.log("chatId:", chatId, "messageId:", messageId); // Debugging line
    const newText = prompt("Edit your message:");
    if (newText !== null) {
        const messageRef = doc(db, "chats", chatId, "messages", messageId);
        updateDoc(messageRef, { text: newText })
            .then(() => console.log("Message updated successfully."))
            .catch(error => console.error("Error updating message:", error));
    }
}

function deleteMessage(chatId, messageId) {
    const confirmDelete = confirm("Are you sure you want to delete this message?");
    if (confirmDelete) {
        const messageRef = doc(db, "chats", chatId, "messages", messageId);
        deleteDoc(messageRef)
            .then(() => console.log("Message deleted successfully."))
            .catch(error => console.error("Error deleting message:", error));
    }
}

function sendMessage(chatId) {
    const messageInput = document.getElementById("message-input");
    const imageInput = document.getElementById("image-input");
    const uploadImageButton = document.getElementById("upload-image-button"); // Reference the button
    const messageText = messageInput.value.trim();
    const currentUser = auth.currentUser;

    if (!currentUser || (!messageText && imageInput.files.length === 0)) {
        console.error("Message cannot be empty.");
        return;
    }

    const messageData = {
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        seen: false // Mark as unseen initially
    };

    if (messageText) messageData.text = messageText;

    if (imageInput.files.length > 0) {
        const imageFile = imageInput.files[0];
        const storageRef = ref(storage, `chats/${chatId}/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on(
            "state_changed",
            null,
            (error) => console.error("Upload error:", error),
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    messageData.imageUrl = downloadURL;
                    addMessageToFirestore(chatId, messageData);

                    // Change the button text to "Image Uploaded" after upload completes
                    uploadImageButton.textContent = "Upload Image";
                });
            }
        );
    } else {
        addMessageToFirestore(chatId, messageData);
    }

    // Clear input fields after sending the message
    messageInput.value = '';
    imageInput.value = '';

    // Reset the button text when a new file is selected
    imageInput.addEventListener("change", () => {
        uploadImageButton.textContent = "Upload Image";
    });
}

function addMessageToFirestore(chatId, messageData) {
    const messagesRef = collection(db, "chats", chatId, "messages");

    addDoc(messagesRef, messageData)
        .then(() => {
            console.log("Message sent successfully.");
        })
        .catch(error => {
            console.error("Error sending message: ", error);
        });
}

auth.onAuthStateChanged(user => {
    if (user) {
        fetchAllUsers();
    } else {
        window.location.href = "login.html";
    }
});

