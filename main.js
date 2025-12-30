// --- 1. FIREBASE SETUP ---

const firebaseConfig ={
apiKey:"AIzaSyBxnxa5ffRlelk3-SxBGemmnGFjkJ8mP2U",
authDomain:"village-connect-dabff.firebaseapp.com",
projectId:"village-connect-dabff", 
storageBucket:
"village-connect-dabff.firebasestorage.app",
messagingSenderId:"885677166072", 
appId:"1:885677166072:web:49ae174770de8de0a49a0d"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // This is your Cloud Database

// --- 2. THE SEARCH FUNCTION (Cloud Version) ---
// --- 2. THE SEARCH FUNCTION (Live Real-Time Version) ---
function findTraditions()   {      // Loop through the LIVE results
            querySnapshot.forEach((doc) => {
                let t = doc.data(); 
                let id = doc.id;
                let likeCount = t.likes || 0; 

                // 1. CHECK LOCAL STORAGE (Did this phone like it?)
                let userLiked = localStorage.getItem("liked_" + id) === "yes";
                
                // 2. SET STYLES (Grey if liked, Red if not)
                let btnColor = userLiked ? "grey" : "red"; 
                let btnCursor = userLiked ? "not-allowed" : "pointer";

                resultBox.innerHTML += `
                    <div class="card">
                        <h3>${t.title}</h3>
                        <p>${t.desc}</p>
                        <small>📅 ${t.date} | 📍 ${t.city.toUpperCase()}</small>
                        <br><br>
                        
                        <button onclick="likeTradition('${id}')" style="background: white; border: 1px solid ${btnColor}; color: ${btnColor}; cursor: ${btnCursor}; margin-right: 10px;">
                           ❤️ ${likeCount}
                        </button>

                        <button onclick="deleteTradition('${id}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                `;
            });
}

// --- 3. THE ADD FUNCTION (Cloud Version) ---
function addTradition() {
    let cityInput = document.getElementById("newCity").value.trim().toLowerCase();
    let titleInput = document.getElementById("newTitle").value.trim();
    let dateInput = document.getElementById("newDate").value;
    let descInput = document.getElementById("newDesc").value;

    if (cityInput === "" || titleInput === "") {
        alert("Please fill in the details!");
        return;
    }

    // Save to Firebase Cloud
    db.collection("traditions").add({
        city: cityInput,
        title: titleInput,
        desc: descInput,
        date: dateInput,
        likes:0,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Time it was added
    })
    .then(() => {
        alert("Success! Saved to the Global Cloud.");
        
        // Clear Inputs
        document.getElementById("newCity").value = "";
        document.getElementById("newTitle").value = "";
        document.getElementById("newDate").value = "";
        document.getElementById("newDesc").value = "";
        
        // Auto Search
        document.getElementById("cityInput").value = cityInput;
        
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
        alert("Error saving: " + error.message);
    });
}
// --- 4. THE DELETE FUNCTION ---
function deleteTradition(id) {
    // 1. Confirm with the user
    if (confirm("Are you sure you want to delete this?") === true) {
        
        // 2. Delete from Cloud
        db.collection("traditions").doc(id).delete()
        .then(() => {
            alert("Tradition deleted!");

        })
        .catch((error) => {
            console.error("Error removing document: ", error);
            alert("Error deleting: " + error.message);
        });
    }
}
// --- 5. THE LIKE FUNCTION ---
// --- 5. THE SMART LIKE FUNCTION ---
function likeTradition(id) {
    // 1. Check: Did this specific phone already like this specific ID?
    let alreadyLiked = localStorage.getItem("liked_" + id);

    if (alreadyLiked === "yes") {
        alert("You already liked this! ❤️");
        return; // 🛑 STOP HERE. Do not talk to Firebase.
    }

    // 2. If not, send the Like to Firebase
    db.collection("traditions").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    })
    .then(() => {
        console.log("Like added!");
        
        // 3. 💾 STAMP THE HAND: Save to phone memory
        localStorage.setItem("liked_" + id, "yes");
    })
    .catch((error) => {
        console.error("Error liking: ", error);
    });
}

