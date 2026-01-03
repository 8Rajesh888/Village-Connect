// --- 1. FIREBASE CONFIG (Your Real Keys 🔑) ---
const firebaseConfig = {
  apiKey: "AIzaSyBxnxa5ffRlelk3-SxBGemmnGFjkJ8mP2U",
  authDomain: "village-connect-dabff.firebaseapp.com",
  projectId: "village-connect-dabff",
  storageBucket: "village-connect-dabff.firebasestorage.app",
  messagingSenderId: "885677166072",
  appId: "1:885677166072:web:49ae174770de8d00a49a0d"
};

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
// ⚠️ PASTE YOUR REAL API KEYS HERE FROM FIREBASE CONSOLE


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
var currentUser = null; // Who is logged in?
var editId = null;      // Are we editing a post? (null = no)

// ==========================================
// 2. AUTHENTICATION (Login/Logout)
// ==========================================

// 🟢 GOOGLE LOGIN (Popup Mode - Best for Localhost)
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login Success:", result.user);
        })
        .catch((error) => {
            alert("Login Failed: " + error.message);
        });
}

// 🔴 LOGOUT
function logout() {
    auth.signOut().then(() => {
        alert("Logged Out!");
        location.reload(); // Refresh page to clear data
    });
}

// 👮 SECURITY GUARD (Listen for Login Changes)
auth.onAuthStateChanged((user) => {
    const gate = document.getElementById("welcomeGate");
    const app = document.getElementById("mainApp");
    const addBox = document.getElementById("addBox");

    if (user) {
        // --- USER IS LOGGED IN ---
        currentUser = user;
        
        // 1. Open the App
        if(gate) gate.style.display = "none";
        if(app) app.style.display = "block";

        // 2. Update Header
        document.getElementById("welcomeMsg").innerText = "Hi, " + user.displayName;
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "inline-block";

        // 3. Show "Add Tradition" Form
        if(addBox) addBox.style.display = "block";

    } else {
        // --- USER IS GUEST / LOGGED OUT ---
        currentUser = null;

        // 1. Update Header
        document.getElementById("welcomeMsg").innerText = "Guest Mode";
        document.getElementById("btnLogin").style.display = "inline-block";
        document.getElementById("btnLogout").style.display = "none";

        // 2. Hide "Add Tradition" Form
        if(addBox) addBox.style.display = "none";
    }
});

// 🏃 GUEST ENTRY BUTTON
function enterAsGuest() {
    document.getElementById("welcomeGate").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// ==========================================
// 3. ADD & EDIT TRADITIONS
// ==========================================

function addTradition() {
    // Security Check
    if (!currentUser) return alert("Please sign in to post!");

    // Get Data from HTML
    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;

    // Validation
    if (!city || !title) return alert("Please fill in City and Event Name.");

    // ARE WE EDITING OR ADDING?
    if (editId) {
        // --- UPDATE EXISTING ---
        db.collection("traditions").doc(editId).update({
            city: city.toLowerCase(),
            displayCity: city,
            title: title,
            date: date,
            desc: desc
        }).then(() => {
            alert("Updated Successfully! ✅");
            resetForm();
            findTraditions(); // Refresh list
        });
    } else {
        // --- ADD NEW (Secured 🔒) ---
        db.collection("traditions").add({
            city: city.toLowerCase(),
            displayCity: city,
            title: title,
            date: date,
            desc: desc,
            author: currentUser.displayName, // Visible Name
            uid: currentUser.uid,            // 🚨 SECRET ID (This proves ownership!)
            likes: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("Tradition Added! 🎉");
            resetForm();
        });
    }

}

// Clear the form after submit
function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newDesc").value = "";
    
    editId = null; // Stop editing mode
    let btn = document.querySelector("#addBox button");
    btn.innerText = "Submit Tradition";
    btn.style.background = "#4CAF50"; // Green
}

// ==========================================
// 4. SEARCH & DISPLAY
// ==========================================
function findTraditions() {
    const searchCity = document.getElementById("cityInput").value.trim().toLowerCase();
    const resultList = document.getElementById("resultList");
    
    if (!searchCity) return alert("Please enter a city name.");

    resultList.innerHTML = "<p>Searching...</p>";

    db.collection("traditions")
      .where("city", "==", searchCity)
      .get()
      .then((querySnapshot) => {
          resultList.innerHTML = ""; 

          if (querySnapshot.empty) {
              resultList.innerHTML = "<p>No traditions found here yet.</p>";
              return;
          }

          querySnapshot.forEach((doc) => {
              const t = doc.data();
              const id = doc.id;
              
              // 1. Check Ownership 🛡️
              // (Is the logged-in user the same person who created this?)
              const isOwner = currentUser && t.uid === currentUser.uid;

              // 2. Prepare Buttons (Only show Edit/Delete if Owner)
              let actionButtons = "";
              if (isOwner) {
                  actionButtons = `
                      <button onclick="editTradition('${id}')" style="background:orange; color:white; border:none; padding:5px 10px; margin-right:5px; cursor:pointer;">
                          Edit
                      </button>
                      <button onclick="deleteTradition('${id}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">
                          Delete
                      </button>
                  `;
              }

              // 3. Check Likes
              let isLiked = localStorage.getItem("liked_" + id) === "yes";
              let heartColor = isLiked ? "grey" : "red";

              // 4. Create HTML
              resultList.innerHTML += `
                  <div class="card">
                      <h3>${t.title}</h3>
                      <p>${t.desc}</p>
                      <small>📅 ${t.date} | 📍 ${t.displayCity || t.city}</small>
                      <br><br>
                      
                      <button onclick="likeTradition('${id}')" style="background:white; border:1px solid ${heartColor}; color:${heartColor}; margin-right:5px; cursor:pointer;">
                          ❤️ ${t.likes || 0}
                      </button>

                      ${actionButtons}
                      
                      <br>
                      <small style="color:#888; font-size:10px;">By: ${t.author || "Guest"}</small>
                  </div>
              `;
          });
      })
      .catch(err => {
          console.error("Search Error:", err);
          resultList.innerHTML = "Error loading data.";
      });
}


// ==========================================
// 5. ACTION BUTTONS (Like, Edit, Delete)
// ==========================================

// ❤️ LIKE FUNCTION
function likeTradition(id) {
    if (!currentUser) return alert("Please sign in to like! 🔒");
    
    if (localStorage.getItem("liked_" + id) === "yes") {
        return alert("You already liked this! ❤️");
    }

    // Save to LocalStorage so they can't like again
    localStorage.setItem("liked_" + id, "yes");

    // Update Database
    db.collection("traditions").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
        findTraditions(); // Refresh to show new number
    });
}

// ✏️ EDIT FUNCTION
function editTradition(id) {
    if (!currentUser) return alert("Please sign in to edit!");

    // Scroll to top
    window.scrollTo(0, 0);

    // Get data from DB
    db.collection("traditions").doc(id).get().then((doc) => {
        let data = doc.data();
        
        // Fill the form
        document.getElementById("newCity").value = data.displayCity || data.city;
        document.getElementById("newTitle").value = data.title;
        document.getElementById("newDate").value = data.date;
        document.getElementById("newDesc").value = data.desc;

        // Turn on "Edit Mode"
        editId = id;
        let btn = document.querySelector("#addBox button");
        btn.innerText = "Update Tradition";
        btn.style.background = "orange";
    });
}

// 🗑️ DELETE FUNCTION
function deleteTradition(id) {
    if (!currentUser) return alert("Please sign in to delete!");

    if (confirm("Are you sure you want to delete this?")) {
        db.collection("traditions").doc(id).delete()
            .then(() => {
                alert("Deleted.");
                findTraditions(); // Refresh list
            });
    }
}
