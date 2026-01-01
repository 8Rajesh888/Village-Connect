// --- 1. FIREBASE CONFIG ---
// (Make sure your config is correct here)
const firebaseConfig = {
    apiKey: "AIzaSyDwnoGf4Rlelk5-5mRGemwSFjkJbmP2P", // (I used the one from your screenshot)
    authDomain: "village-connect-dabff.firebaseapp.com",
    projectId: "village-connect-dabff",
    storageBucket: "village-connect-dabff.firebasestorage.app",
    messagingSenderId: "855677106072",
    appId: "1:855677106072:web:cba1747761eb868a855d6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL VARIABLES ---
var currentUser = null;
var editId = null;

// --- 2. WELCOME GATE LOGIC ---
function enterAsGuest() {
    document.getElementById("welcomeGate").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// --- 3. AUTH LISTENER (The Brain) ---
auth.onAuthStateChanged((user) => {
    let addBox = document.getElementById("addBox");
    let welcomeGate = document.getElementById("welcomeGate");
    let mainApp = document.getElementById("mainApp");

    if (user) {
        // 🟢 LOGGED IN
        currentUser = user;
        
        // Open the gates
        if(welcomeGate) welcomeGate.style.display = "none";
        if(mainApp) mainApp.style.display = "block";

        // Setup UI
        document.getElementById("welcomeMsg").innerText = "Hi, " + user.displayName;
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "inline-block";
        
        // Show Add Form
        if (addBox) addBox.style.display = "block";

    } else {
        // 🔴 LOGGED OUT
        currentUser = null;
        
        // Note: We don't force the gate open/closed here, 
        // we let the user click "Guest" if they want.

        document.getElementById("welcomeMsg").innerText = "Guest Mode";
        document.getElementById("btnLogin").style.display = "inline-block";
        document.getElementById("btnLogout").style.display = "none";

        // Hide Add Form
        if (addBox) addBox.style.display = "none";
    }
});

// --- 4. LOGIN / LOGOUT ---
function googleLogin() {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => console.log("Login Success"))
        .catch(err => alert("Login Failed: " + err.message));
}

function logout() {
    auth.signOut().then(() => location.reload());
}

// --- 5. SEARCH FUNCTION ---
function findTraditions() {
    let input = document.getElementById("cityInput").value.trim().toLowerCase();
    let resultBox = document.getElementById("resultList");

    if(input === "") {
        resultBox.innerHTML = "<p>Please enter a city name.</p>";
        return;
    }

    resultBox.innerHTML = "Searching..."; 

    db.collection("traditions").where("city", "==", input)
    .onSnapshot((querySnapshot) => {
        resultBox.innerHTML = ""; 
        
        if (querySnapshot.empty) {
            resultBox.innerHTML = "<p>No traditions found here yet.</p>";
        } else {
            querySnapshot.forEach((doc) => {
                let t = doc.data();
                let id = doc.id;
                let likes = t.likes || 0;
                
                // Check if liked
                let userLiked = localStorage.getItem("liked_" + id) === "yes";
                let btnColor = userLiked ? "grey" : "red";
                let btnCursor = userLiked ? "not-allowed" : "pointer";

                resultBox.innerHTML += `
                    <div class="card">
                        <h3>${t.title}</h3>
                        <p>${t.desc}</p>
                        <small>📅 ${t.date} | 📍 ${t.city.toUpperCase()}</small>
                        <br><br>
                        
                        <button onclick="likeTradition('${id}')" style="background: white; border: 1px solid ${btnColor}; color: ${btnColor}; cursor: ${btnCursor}; margin-right: 10px;">
                           ❤️ ${likes}
                        </button>

                        <button onclick="editTradition('${id}')" style="background: orange; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px;">
                            Edit
                        </button>

                        <button onclick="deleteTradition('${id}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                `;
            });
        }
    });
}

// --- 6. ADD / UPDATE FUNCTION ---
function addTradition() {
    let city = document.getElementById("newCity").value.trim().toLowerCase();
    let title = document.getElementById("newTitle").value.trim();
    let date = document.getElementById("newDate").value;
    let desc = document.getElementById("newDesc").value;

    if (!city || !title) return alert("Please fill details!");

    if (editId) {
        // UPDATE
        db.collection("traditions").doc(editId).update({
            city: city, title: title, date: date, desc: desc
        }).then(() => { alert("Updated!"); resetForm(); });
    } else {
        // CREATE
        db.collection("traditions").add({
            city: city, title: title, date: date, desc: desc,
            likes: 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { alert("Added!"); resetForm(); });
    }
}

// --- 7. HELPER FUNCTIONS ---
function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newDesc").value = "";
    editId = null;
    let btn = document.querySelector("button[onclick='addTradition()']");
    btn.innerText = "Submit Tradition";
    btn.style.background = "#4CAF50";
}

function editTradition(id) {
    if (!currentUser) return alert("Sign in to edit!"); // Security
    window.scrollTo(0,0);
    db.collection("traditions").doc(id).get().then((doc) => {
        let data = doc.data();
        document.getElementById("newCity").value = data.city;
        document.getElementById("newTitle").value = data.title;
        document.getElementById("newDate").value = data.date;
        document.getElementById("newDesc").value = data.desc;
        editId = id;
        let btn = document.querySelector("button[onclick='addTradition()']");
        btn.innerText = "Update Tradition";
        btn.style.background = "orange";
    });
}

function deleteTradition(id) {
    if (!currentUser) return alert("Sign in to delete!"); // Security
    if(confirm("Are you sure?")) {
        db.collection("traditions").doc(id).delete();
    }
}

function likeTradition(id) {
    if (!currentUser) return alert("Sign in to like!");
    if (localStorage.getItem("liked_" + id) === "yes") return alert("Already liked!");
    
    localStorage.setItem("liked_" + id, "yes");
    db.collection("traditions").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    });
}
