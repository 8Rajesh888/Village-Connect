// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBxnxa5ffRlelk3-SxBGemmnGFjkJ8mP2U",
    authDomain: "village-connect-dabff.firebaseapp.com",
    projectId: "village-connect-dabff",
    storageBucket: "village-connect-dabff.firebasestorage.app",
    messagingSenderId: "885677166072",
    appId: "1:885677166072:web:49ae174770de8d00a49a0d"
};
  
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
var currentUser = null; 
var editId = null;      

// ==========================================
// 2. AUTHENTICATION (Login/Logout)
// ==========================================

// 🟢 GOOGLE LOGIN
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
        location.reload(); 
    });
}

// 👮 SECURITY GUARD
auth.onAuthStateChanged((user) => {
    const gate = document.getElementById("welcomeGate");
    const app = document.getElementById("mainApp");
    const addBox = document.getElementById("addBox");

    if (user) {
        currentUser = user;
        if(gate) gate.style.display = "none";
        if(app) app.style.display = "block";

        document.getElementById("welcomeMsg").innerText = "Hi, " + user.displayName;
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "inline-block";

        if(addBox) addBox.style.display = "block";

    } else {
        currentUser = null;
        document.getElementById("welcomeMsg").innerText = "Guest Mode";
        document.getElementById("btnLogin").style.display = "inline-block";
        document.getElementById("btnLogout").style.display = "none";
        if(addBox) addBox.style.display = "none";
    }
});

function enterAsGuest() {
    document.getElementById("welcomeGate").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// ==========================================
// 3. ADD & EDIT TRADITIONS (With Photos 📸)
// ==========================================

function addTradition() {
    if (!currentUser) return alert("Please sign in to post!");

    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;
    const fileInput = document.getElementById("newPhoto");
    const file = fileInput.files[0];

    if (!city || !title) return alert("Please fill in City and Event Name.");

    // 📸 PHOTO LOGIC: Check size limit (1MB)
    if (file && file.size > 1000000) {
        return alert("File is too big! Please use an image smaller than 1MB.");
    }

    // Helper function to save to DB
    const saveToDB = (photoString) => {
        if (editId) {
            // --- UPDATE ---
            let updateData = {
                city: city.toLowerCase(),
                displayCity: city,
                title: title,
                date: date,
                desc: desc
            };
            if (photoString) updateData.photo = photoString; // Only update photo if new one provided

            db.collection("traditions").doc(editId).update(updateData).then(() => {
                alert("Updated Successfully! ✅");
                resetForm();
                findTraditions(); 
            });
        } else {
            // --- ADD NEW ---
            db.collection("traditions").add({
                city: city.toLowerCase(),
                displayCity: city,
                title: title,
                date: date,
                desc: desc,
                photo: photoString || "", // Save empty string if no photo
                author: currentUser.displayName,
                uid: currentUser.uid,            
                likes: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("Tradition Added! 🎉");
                resetForm();
            });
        }
    };

    // If there is a file, convert it. If not, just save.
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result; // This is the image as text
            saveToDB(base64String);
        };
        reader.readAsDataURL(file);
    } else {
        saveToDB(null); // No photo
    }
}

function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newDesc").value = "";
    document.getElementById("newPhoto").value = ""; // Clear file input
    
    editId = null; 
    let btn = document.querySelector("#addBox button");
    btn.innerText = "Submit Tradition";
    btn.style.background = "#4CAF50"; 
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
              
              const isOwner = currentUser && t.uid === currentUser.uid;

              let actionButtons = "";
              if (isOwner) {
                  actionButtons = `
                      <button onclick="editTradition('${id}')" style="background:orange; color:white; border:none; padding:5px 10px; margin-right:5px; cursor:pointer;">Edit</button>
                      <button onclick="deleteTradition('${id}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">Delete</button>
                  `;
              }

              let isLiked = localStorage.getItem("liked_" + id) === "yes";
              let heartColor = isLiked ? "grey" : "red";

              // 📸 CHECK FOR PHOTO
              let photoHTML = "";
              if (t.photo) {
                  photoHTML = `<img src="${t.photo}" style="width:100%; max-height:300px; object-fit:cover; border-radius:5px; margin-top:10px;">`;
              }

              resultList.innerHTML += `
                  <div class="card">
                      <h3>${t.title}</h3>
                      ${photoHTML}
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
// 5. ACTIONS
// ==========================================

function likeTradition(id) {
    if (!currentUser) return alert("Please sign in to like! 🔒");
    if (localStorage.getItem("liked_" + id) === "yes") return alert("You already liked this! ❤️");

    localStorage.setItem("liked_" + id, "yes");

    db.collection("traditions").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
        let btn = document.activeElement;
        if(btn) btn.style.color = "grey"; 
    });
}

function editTradition(id) {
    if (!currentUser) return alert("Please sign in to edit!");
    window.scrollTo(0, 0);

    db.collection("traditions").doc(id).get().then((doc) => {
        let data = doc.data();
        document.getElementById("newCity").value = data.displayCity || data.city;
        document.getElementById("newTitle").value = data.title;
        document.getElementById("newDate").value = data.date;
        document.getElementById("newDesc").value = data.desc;
        // Note: We don't preload the file input because browsers block that for security.

        editId = id;
        let btn = document.querySelector("#addBox button");
        btn.innerText = "Update Tradition";
        btn.style.background = "orange";
    });
}

function deleteTradition(id) {
    if (!currentUser) return alert("Please sign in to delete!");
    if (confirm("Are you sure you want to delete this?")) {
        db.collection("traditions").doc(id).delete().then(() => {
            alert("Deleted.");
            findTraditions(); 
        });
    }
}
/* =========================================
   MOBILE "MINI-BRAIN" SEARCH ENGINE 🧠
   (Runs 100% in your browser, no server needed)
   ========================================= */

// 1. The "Database" (Simulated Memory)
const villageData = [
    { 
        id: 1, 
        city: "Kavutaram", 
        text: "The heavy rain festival happens in August. Farmers pray for good harvest.", 
        tags: ["festival", "rain", "prayer"] 
    },
    { 
        id: 2, 
        city: "Kavutaram", 
        text: "The big Banyan Tree was planted in 1950. It is a meeting spot for elders.", 
        tags: ["nature", "tree", "history", "1950"] 
    },
    { 
        id: 3, 
        city: "Vijayawada", 
        text: "Famous for spicy mango pickle made in summer. It uses a secret grandmother recipe.", 
        tags: ["food", "pickle", "spicy"] 
    },
    { 
        id: 4, 
        city: "Coastal AP", 
        text: "Fishermen use hand-woven nets. This tradition is fading away.", 
        tags: ["fishing", "ocean", "craft"] 
    }
];

// 2. The Search Function (The Logic)
function findTraditions() {
    const query = document.getElementById('cityInput').value.toLowerCase();
    const resultList = document.getElementById('resultList');
    
    // Clear previous results
    resultList.innerHTML = "";
    resultList.innerHTML = `<p style="color:#666; font-style:italic;">🔍 Searching for "${query}"...</p>`;

    // ARTIFICIAL DELAY (To make it feel like AI is thinking)
    setTimeout(() => {
        const matches = villageData.filter(item => {
            // Check City OR Text content OR Tags
            return item.city.toLowerCase().includes(query) || 
                   item.text.toLowerCase().includes(query) ||
                   item.tags.some(tag => tag.includes(query));
        });

        displayResults(matches);
    }, 800); 
}

// 3. The Display (The UI)
function displayResults(matches) {
    const resultList = document.getElementById('resultList');
    resultList.innerHTML = ""; // Clear "Searching..."

    if (matches.length === 0) {
        resultList.innerHTML = `<div class="card"><p>❌ No traditions found. Try "food" or "tree".</p></div>`;
        return;
    }

    matches.forEach(item => {
        const card = `
            <div class="card" style="border-left: 4px solid #ffcc00; animation: slideUp 0.3s ease;">
                <h3>📍 ${item.city}</h3>
                <p>${item.text}</p>
                <small style="color:#2a5298; font-weight:bold;">#${item.tags.join(" #")}</small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}
