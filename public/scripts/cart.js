import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

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
const db = getFirestore(app);

// Function to delete an item from the cart
async function deleteCartItem(userId, cartItemId) {
    console.log(`Deleting cart item with ID: ${cartItemId}`);
    const cartItemRef = doc(db, `users/${userId}/cart/${cartItemId}`);
    try {
        await deleteDoc(cartItemRef);
        console.log("Item deleted successfully.");
        alert("Item deleted from cart.");
        displayCartItems({ uid: userId }); // Refresh the cart display after deletion
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}

// Function to clear all child elements of a container
function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

// Function to display cart items, grouped by seller account and item quantity, and show total price
async function displayCartItems(user) {
    console.log("Fetching cart items for user:", user.uid);
    const cartItemsContainer = document.getElementById("cart-items-container");
    clearContainer(cartItemsContainer); // Clear previous content

    const cartRef = collection(db, `users/${user.uid}/cart`);
    const cartSnapshot = await getDocs(cartRef);

    if (cartSnapshot.empty) {
        console.log("Cart is empty.");
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "Your cart is empty.";
        cartItemsContainer.appendChild(emptyMessage);
        return;
    }

    // Group items by seller account and calculate total price
    const itemsBySeller = {};
    let totalCartPrice = 0; // Initialize total price for the cart

    // Local ItemData
    let localdata = [];
    cartSnapshot.forEach((doc) => {
        const itemData = doc.data();
        localdata.push(itemData);
        const cartItemId = doc.id; // Get document ID for deletion
        const sellerAccount = itemData.account;

        if (!itemsBySeller[sellerAccount]) {
            itemsBySeller[sellerAccount] = {};
        }

        // Group items by name and price
        const itemKey = `${itemData.itemName}-${itemData.itemPrice}`;

        // Get the quantity directly from the itemData
        const quantity = itemData.quantity || 1; // Use the quantity from Firestore

        if (itemsBySeller[sellerAccount][itemKey]) {
            itemsBySeller[sellerAccount][itemKey].quantity += quantity; // Accumulate the quantity
        } else {
            itemsBySeller[sellerAccount][itemKey] = { ...itemData, cartItemId, quantity }; // Include quantity
        }
    });

    console.log("Grouped items by seller:", itemsBySeller);

    // Display items grouped by seller account
    for (const seller in itemsBySeller) {
        console.log(`Displaying items for seller: ${seller}`);
        const sellerSection = document.createElement("div");
        sellerSection.classList.add("seller-section");

        const sellerTitle = document.createElement("h2");
        sellerTitle.textContent = `Make Purchase from: ${seller}`;
        sellerSection.appendChild(sellerTitle);
        for (const itemKey in itemsBySeller[seller]) {
            const item = itemsBySeller[seller][itemKey];
            const { quantity, itemPrice, itemName, itemImage, cartItemId } = item;

            const totalPriceForItem = itemPrice * quantity; // Calculate total price for this item

            // Update the total cart price
            totalCartPrice += totalPriceForItem;

            console.log(`Displaying item:`, item);

            // Create item display elements
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("cart-item");

            const itemImageElement = document.createElement("img");
            itemImageElement.src = itemImage;
            itemImageElement.alt = itemName;
            itemImageElement.classList.add("cart-item-image");

            const itemNameElement = document.createElement("h3");
            itemNameElement.textContent = itemName;

            const itemQuantityElement = document.createElement("p");
            itemQuantityElement.textContent = `Quantity: ${quantity}`;

            const itemTotalPriceElement = document.createElement("p");
            itemTotalPriceElement.textContent = `Total Price: SGD ${totalPriceForItem.toFixed(2)}`;

            // Remove Button
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.classList.add("btn", "delete-button");
            removeButton.addEventListener("click", () => deleteCartItem(user.uid, cartItemId));

            // Append item details to the item div
            itemDiv.appendChild(itemImageElement);
            itemDiv.appendChild(itemNameElement);
            itemDiv.appendChild(itemQuantityElement);
            itemDiv.appendChild(itemTotalPriceElement);
            itemDiv.appendChild(removeButton);

            sellerSection.appendChild(itemDiv);
        }

        cartItemsContainer.appendChild(sellerSection);
    }

    console.log("Total price of items in cart:", totalCartPrice);

    // Display total cart price and checkout button
    const totalContainer = document.createElement("div");
    totalContainer.classList.add("total-container");

    const totalPriceElement = document.createElement("p");
    totalPriceElement.classList.add("total-price");
    totalPriceElement.textContent = `Total Cart Price: SGD ${totalCartPrice.toFixed(2)}`;
    totalContainer.appendChild(totalPriceElement);

    const checkoutButton = document.createElement("button");
    checkoutButton.textContent = "Checkout";
    checkoutButton.classList.add("btn", "checkout-button");
    checkoutButton.addEventListener("click", () => {
        // console.log("HELP", localdata);
        addToOrder(localdata);
        console.log("Proceeding to checkout.");
        // window.location.href = "/checkout.html"; // Adjust the URL as needed
    });
    totalContainer.appendChild(checkoutButton);

    cartItemsContainer.appendChild(totalContainer);
}

// Check for user authentication and display cart items
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated:", user.uid);
        displayCartItems(user);
    } else {
        console.log("User not authenticated. Redirecting to login page.");
        // Redirect to login page if not logged in
        window.location.href = "/login.html";
    }
});

const addToOrder = async (itemData) => {
    itemData.sort((a, b) => a.sellerUid - b.sellerUid);
    const user = auth.currentUser;
    const userDisplayName = auth.currentUser.displayName;
    const userId = user.uid;
    const c1 = userId.substring(0, 3);
    const c2 = userId.substring(10, 13);
    const c3 = new Date().toISOString();
    let docid = "";

    let grouped = {};
    itemData.forEach(obj => {
        let selluid = obj.sellerUid;
        if (!grouped[selluid]) {
            grouped[selluid] = [];
        }
        grouped[selluid].push(obj);
    });

    // Process each group (grouped by sellerUid)
    for (const [key, value] of Object.entries(grouped)) {
        const c4 = value[0].sellerUid.substring(0, 3);
        docid = c1 + c2 + c3.substring(8, 13) + c3.substring(20, 24) + c4;

        let ttprice = 0;
        let count = 0;
        let datamap = {};
        value.forEach(item => {
            const itemarr = [];
            itemarr.push(item.itemName);
            itemarr.push(item.itemPrice);
            itemarr.push(item.quantity);
            itemarr.push(item.totalPrice);
            itemarr.push(item.itemImage);
            const k = 'Item' + count.toString();
            datamap[k] = itemarr;
            ttprice += item.totalPrice;
            count += 1;
        });

        let fields = {
            OrderID: docid,
            PlaceDate: new Date(),
            TotalPrice: ttprice,
            account: userDisplayName,
            sellaccount: value[0].account,
            selluid: key,
            status: "Ongoing",
            uid: userId
        };

        let documentData = {
            Items: datamap,
            ...fields
        };

        try {
            await setDoc(doc(collection(db, "porders"), docid), documentData);
            console.log(`Document ${docid} successfully written!`);
        }
        catch (error) {
            console.error(`Error writing document ${docid}: `, error);
        }
    }

    // Clear all items from the user's cart



    // Redirect to the checkout page
    window.location.href = "/checkout.html";
};





