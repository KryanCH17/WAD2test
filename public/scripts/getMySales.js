import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

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
var allOrders = [];

// Function to retrieve and display sales orders made by the current user
async function retrieveUserOrders() {
    // console.log('called sales order');
    // const salesOrder = document.getElementById('sales-order');
    const salesAll = document.getElementById('pills-all');
    const salesOngoing = document.getElementById('pills-ongoing');
    const salesCompleted = document.getElementById('pills-completed');
    const salesCancelled = document.getElementById('pills-cancelled');
    const user = auth.currentUser;
    // console.log("User is authenticated:", user);
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const q = query(
                collection(db, "porders"),
                where("selluid", "==", user.uid),
                orderBy("PlaceDate", "desc")
            );
            // const filteredResults = [];
            const querySnapshot = await getDocs(q);
            
            salesAll.innertext = "";
            salesOngoing.innertext = "";
            salesCompleted.innertext = "";
            salesCancelled.innertext = "";

            if (querySnapshot.empty) {
                const noMatchingOrders = document.createElement('div');
                noMatchingOrders.classList.add('text-center', 'my-5', 'fs-4', 'fw-bold');
                noMatchingOrders.textContent = 'No Orders';

                salesAll.appendChild(noMatchingOrders);
                salesOngoing.appendChild(noMatchingOrders);
                salesCompleted.appendChild(noMatchingOrders);
                salesCancelled.appendChild(noMatchingOrders);
            } else {
                querySnapshot.forEach((doc) => {
                    const salesData = doc.data();
                    // console.log("s   alesdata=", salesData)
                    allOrders.push(salesData);
                    // const items = salesData.Items; 
                    if (salesData.selluid == user.uid) {
                        displaySOrder(doc.id, salesData, salesAll);
                        if (salesData.status == "Ongoing"){
                            displaySOrder(doc.id, salesData, salesOngoing);
                        }
                        if (salesData.status == "Completed"){
                            displaySOrder(doc.id, salesData, salesCompleted); 
                        }
                        if (salesData.status == "Cancelled"){
                            displaySOrder(doc.id, salesData, salesCancelled);
                        }
                    }
                });
                const all = document.getElementById('pills-all');
                const pend = document.getElementById('pills-ongoing');
                const comp = document.getElementById('pills-completed');
                const can = document.getElementById('pills-cancelled');
                if (all.textContent.trim() === ''){
                    const noMatchingOrders = document.createElement('div');
                    noMatchingOrders.classList.add('text-center', 'my-5', 'fs-4', 'fw-bold');
                    noMatchingOrders.textContent = 'No Orders';

                    all.appendChild(noMatchingOrders);
                    // all.innerText = "No Orders";
                }
                if (pend.textContent.trim() === ''){
                    const noMatchingOrders = document.createElement('div');
                    noMatchingOrders.classList.add('text-center', 'my-5', 'fs-4', 'fw-bold');
                    noMatchingOrders.textContent = 'No Ongoing Orders';

                    pend.appendChild(noMatchingOrders);
                    // pend.innerText = "No Ongoing Orders";
                }
                if (comp.textContent.trim() === ''){
                    const noMatchingOrders = document.createElement('div');
                    noMatchingOrders.classList.add('text-center', 'my-5', 'fs-4', 'fw-bold');
                    noMatchingOrders.textContent = 'No Completed Orders';

                    comp.appendChild(noMatchingOrders);
                    // comp.innerText = "No Completed Orders";
                }
                if (can.textContent.trim() === ''){
                    const noMatchingOrders = document.createElement('div');
                    noMatchingOrders.classList.add('text-center', 'my-5', 'fs-4', 'fw-bold');
                    noMatchingOrders.textContent = 'No Cancelled Orders';

                    can.appendChild(noMatchingOrders);
                    // can.innerText = "No Cancelled Orders";
                }
            }
        } else {
            salesOrder.innerText = "Please log in to see your orders.";
            setTimeout(() => {
                window.location.href = "/login.html";
            }, 2000);
        }
    });
}

// Function to dynamically create and display purchase elements, including a detail button [not done]
function displaySOrder(salesId, salesData, container) {
    
    const salesTable = document.createElement('Table');
    salesTable.classList.add('table');
    // table row "Order ID", "Date", "Total Amount", "Status"
    const salesTableRow1 = document.createElement('tr');
    
    const salesTableValue1_1 = document.createElement('td');
    // salesTableValue1_1.classList.add('text-center');
    // salesTableValue1_1.rowspan = 2;
    const salesTableValue1_2 = document.createElement('td');
    const salesTableValue1_3 = document.createElement('td');
    const salesTableValue1_4 = document.createElement('td');
    const salesTableValue1_5 = document.createElement('td');

    salesTableValue1_1.classList.add('text-secondary');
    salesTableValue1_2.classList.add('text-secondary');
    salesTableValue1_3.classList.add('text-secondary');
    salesTableValue1_4.classList.add('text-secondary');
    salesTableValue1_5.classList.add('text-secondary');

    salesTableValue1_1.textContent = "Order Number:";
    salesTableValue1_2.textContent = "Order Date";
    salesTableValue1_3.textContent = "Customer";
    salesTableValue1_4.textContent = "Total Order Amount";
    salesTableValue1_5.textContent = "Status";

    salesTableRow1.appendChild(salesTableValue1_1);
    salesTableRow1.appendChild(salesTableValue1_2);
    salesTableRow1.appendChild(salesTableValue1_3);
    salesTableRow1.appendChild(salesTableValue1_4);
    salesTableRow1.appendChild(salesTableValue1_5);

    salesTable.append(salesTableRow1);

    // Data for row one
    const salesTableRow2 = document.createElement('tr');
    const  salesTableValue2_1 = document.createElement('td');
    // salesTableValue1_1.classList.add('text-center');
    // salesTableValue1_1.rowspan = 2;
    const salesTableValue2_2 = document.createElement('td');
    const salesTableValue2_3 = document.createElement('td');
    const salesTableValue2_4 = document.createElement('td');
    const salesTableValue2_5 = document.createElement('td');

    salesTableValue2_1.classList.add('fw-bold', 'fs-5');
    salesTableValue2_2.classList.add('fw-bold', 'fs-5');
    salesTableValue2_3.classList.add('fw-bold', 'fs-5');
    salesTableValue2_4.classList.add('fw-bold', 'fs-5');

    salesTableValue2_1.textContent = salesId.toUpperCase();
    salesTableValue2_2.textContent = salesData.PlaceDate.toDate().toLocaleDateString();
    salesTableValue2_3.textContent = salesData.account;
    salesTableValue2_4.textContent = `SGD ${salesData.TotalPrice.toFixed(2)}`;
    salesTableValue2_5.textContent = salesData.status;

    salesTableValue2_5.classList.add('fs-3', 'fw-bold', 'text-center')
    if (salesData.status == "Ongoing"){
        salesTableValue2_5.classList.add('bg-warning', 'text-light');
    }
    if (salesData.status == "Completed"){
        salesTableValue2_5.classList.add('bg-success', 'text-light');
    }
    if (salesData.status == "Cancelled"){
        salesTableValue2_5.classList.add('bg-danger', 'text-light');
    }
    

    salesTableRow2.appendChild(salesTableValue2_1);
    salesTableRow2.appendChild(salesTableValue2_2);
    salesTableRow2.appendChild(salesTableValue2_3);
    salesTableRow2.appendChild(salesTableValue2_4);
    salesTableRow2.appendChild(salesTableValue2_5);

    salesTable.append(salesTableRow2);
    salesTable.classList.add('border', 'w-75', 'centered-table');
    container.appendChild(salesTable);

    // Item Details
    const salesTableRowItem = document.createElement('tr');
    const orderItems = salesData.Items; 
    // const saleItemDiv = document.createElement('div');
    // saleItemDiv.classList.add('d-flex', 'justify-content-around');
    for (const key in orderItems) {
        const salesTableRowItem = document.createElement('tr');
        // const salesItemCard_R = document.createElement('div');
        // salesItemCard_R.classList.add('card', 'col-3');
        if (orderItems.hasOwnProperty(key)) { 
            // console.log(`Key: ${key}`); 
            const item = orderItems[key]; 
           
            // Item Image Card
            const saleItemImg = document.createElement('img');
            saleItemImg.classList.add('item-img');
            saleItemImg.src = item[4];
            // salesItemCard_R.appendChild(saleItemImg);
            const salesTableRowItem_1 = document.createElement('td');
            salesTableRowItem_1.appendChild(saleItemImg);

            // Sales Card Body
            // const salesItemCardBody = document.createElement('div');
            // salesItemCardBody.classList.add('card-body');
            // salesItemCard_R.appendChild(salesItemCardBody);
           
            // Item Name
            // const salesItemName = document.createElement('h5');
            // salesItemName.classList.add('card-title');
            // salesItemName.textContent = item[0];
            // salesItemCardBody.appendChild(salesItemName);
            const salesTableRowItem_2 = document.createElement('td');
            salesTableRowItem_2.textContent = `${item[0]}`;
             
            // Item Price * Qty
            // const salesItemTimes = document.createElement('p');
            // salesItemTimes.textContent = `SGD ${item[1].toFixed(2)} x ${item[2]}`;
            // salesItemCardBody.appendChild(salesItemTimes);
            const salesTableRowItem_3 = document.createElement('td');
            salesTableRowItem_3.textContent = `SGD ${item[1].toFixed(2)} x ${item[2]}`;
            
            // = Total
            // const salesItemEqual = document.createElement('p');
            // salesItemEqual.classList.add('fs-5', 'fw-bold');
            // salesItemEqual.textContent = `= SGD ${item[3].toFixed(2)}`;
            // salesItemCardBody.appendChild(salesItemEqual);
            const salesTableRowItem_4 = document.createElement('td');
            salesTableRowItem_4.classList.add('fs-5', 'fw-bold');
            salesTableRowItem_4.textContent = `= SGD ${item[3].toFixed(2)}`;

            // Create Card
            // salesTableValue3_R.appendChild(salesItemCard_R);

            // Add Card to row
            // salesTableRowItem.appendChild(salesItemCard_R);
            // salesTable.appendChild(salesTableRowItem);
            // saleItemDiv.appendChild(salesItemCard_R);

            salesTableRowItem.appendChild(salesTableRowItem_1);
            salesTableRowItem.appendChild(salesTableRowItem_2);
            salesTableRowItem.appendChild(salesTableRowItem_3);
            salesTableRowItem.appendChild(salesTableRowItem_4);

            salesTable.appendChild(salesTableRowItem);
        }
    }
    // saleItemDiv.classList.add('border')
    // container.appendChild(saleItemDiv);


    // Button row
    const salesButtonRow = document.createElement('tr');
    const salesTableValue3_1 = document.createElement('td');
    const salesTableValue3_2 = document.createElement('td');
    
    // Complete Button
    const completeButton = document.createElement('button');
    completeButton.textContent = "✓";
    completeButton.classList.add('btn', 'btn-outline-success', 'w-100'); 
    if (salesData.status != "Ongoing") {
        completeButton.disabled = true;
        completeButton.hidden = true;
    }
    salesTableValue3_1.appendChild(completeButton);
    salesTableValue3_1.colSpan = 2;

    completeButton.onclick = () => updateStatus(salesId, "status", "Completed");

    // Reject Button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = "𐤕";
    cancelButton.classList.add('btn', 'btn-outline-danger', 'w-100');
    if (salesData.status != "Ongoing") {
        cancelButton.disabled = true;
        cancelButton.hidden = true;
    }
    salesTableValue3_2.appendChild(cancelButton);
    salesTableValue3_2.colSpan = 3;

    cancelButton.onclick = () => updateStatus(salesId, "status", "Cancelled");

    salesButtonRow.appendChild(salesTableValue3_1);
    salesButtonRow.appendChild(salesTableValue3_2);
    salesTable.appendChild(salesButtonRow);
    
    container.appendChild(salesTable);
}

const updateStatus = async (salesId, field, newValue) => { 
    if (newValue == "Completed"){
        const confirmation = confirm("Are you sure you want to complete this order?");
        if (confirmation) {
            console.log(salesId, field, newValue);
            const docRef = doc(db, "porders", salesId); 
            try { 
                await updateDoc(docRef, { 
                    [field]: newValue 
                }); 
                console.log("Order successfully updated!"); 
            } 
            catch (error) { 
                console.error("Error updating document: ", error); 
            } 
            location.reload();
        }
    }
    else {
        const confirmation = confirm("Are you sure you want to reject this order?");
        if (confirmation) {
            console.log(salesId, field, newValue);
            const docRef = doc(db, "porders", salesId); 
            try { 
                await updateDoc(docRef, { 
                    [field]: newValue 
                }); 
                console.log("Order successfully updated!"); 
            } 
            catch (error) { 
                console.error("Error updating document: ", error); 
            } 
            location.reload();
        }
    }
};

// Template function
function template(postId, postData, container) {
    const postElement = document.createElement('div');
    postElement.classList.add('post-item');

    const itemName = document.createElement('h3');
    itemName.textContent = postData.itemName;

    const image = document.createElement('img');
    image.src = postData.imageUrl;
    image.alt = postData.itemName;
    image.classList.add('post-image');

    const account = document.createElement('p');
    account.textContent = `Posted by: ${postData.account}`;

    // Create and configure the delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = "Delete Post";
    deleteButton.classList.add('btn', 'btn-danger', 'mt-2');
    deleteButton.onclick = () => deletePost(postId, container);

    // Append elements to the post element
    postElement.appendChild(image);
    postElement.appendChild(itemName);
    postElement.appendChild(account);
    postElement.appendChild(deleteButton);

    container.appendChild(postElement);
}



// Month Filter Function
function filterOrdersByMonth() {
    const postsContainer = document.getElementById('pills-all');
    const startMonth = document.getElementById('startMonth').value; 
    const endMonth = document.getElementById('endMonth').value; 
    // console.log('enter filter function');
    // console.log(startMonth);
    // console.log(endMonth);

    const filteredOrders = allOrders.filter(order => { 
        const orderDate = order.PlaceDate.toDate(); 
        const orderMonth = orderDate.getFullYear() + '-' + String(orderDate.getMonth() + 1).padStart(2, '0'); 
        // console.log('fucntion 1', (!startMonth || orderMonth >= startMonth));
        // console.log('fucntion 2', (!endMonth || orderMonth <= endMonth));
        console.log('start', startMonth, 'order', orderDate, 'end', endMonth);
        return (!startMonth || orderMonth >= startMonth) && (!endMonth || orderMonth <= endMonth); 
    });
    // Display filtered order
    // console.log(filteredOrders);
    if (filteredOrders.length == 0) {
        postsContainer.innerText = 'No matching orders';
    } else {
        console.log('filtered orders', filteredOrders);
        postsContainer.innerText = '';
        filteredOrders.forEach(order => displaySOrder(order.OrderID, order, postsContainer));
    }
}

// Event listeners for filter by month button
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterOrdersByMonth(); // Call the filter function
    });
});



const setMaxMonth = () => { 
    const monthInputs = document.querySelectorAll('input[type="month"]'); 
    const today = new Date(); const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0'); 
    monthInputs.forEach(input => input.setAttribute('max', currentMonth)); 
};

// Update end month minimum value based on start month selection 
const updateEndMonthMin = () => { 
    const startMonth = document.getElementById('startMonth').value; 
    const endMonth = document.getElementById('endMonth'); 
    endMonth.setAttribute('min', startMonth); 
}; 

// Set event listener on start month input 
document.getElementById('startMonth').addEventListener('input', updateEndMonthMin);


// Call the function to retrieve and display the user's posts when the page loads
window.onload = retrieveUserOrders;
setMaxMonth();
