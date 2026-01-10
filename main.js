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
  
// Initialize
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 🧠 GLOBAL MEMORY (Stores data from Cloud for fast searching)
let globalTraditions = [];
let currentUser = null; 
let editId = null;      

// ==========================================
// 2. AUTHENTICATION & STARTUP
// ==========================================

// Run this when page loads
window.onload = function() {
    loadFromCloud(); // ☁️ Download Data immediately
};

// 👮 Monitor User Status
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById("navLoginBtn");
    const logoutBtn = document.getElementById("navLogoutBtn");
    const addBox = document.getElementById("addBox");
    const loginWarning = document.getElementById("loginWarning");
    const welcomeMsg = document.getElementById("welcomeMsg");

    if (user) {
        currentUser = user;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        if(addBox) addBox.style.display = "block";
        if(loginWarning) loginWarning.style.display = "none";
        if(welcomeMsg) welcomeMsg.innerText = "Hi, " + user.displayName + " 👋";
    } else {
        currentUser = null;
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        if(addBox) addBox.style.display = "none";
        if(loginWarning) loginWarning.style.display = "block";
        if(welcomeMsg) welcomeMsg.innerText = "Welcome, Guest";
    }
});

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => alert("Login Success!"))
        .catch((e) => alert("Error: " + e.message));
}

function logout() {
    auth.signOut().then(() => location.reload());
}

// ==========================================
// 3. CORE FUNCTIONS (Load, Add, Edit)
// ==========================================

// ☁️ DOWNLOAD DATA FROM FIREBASE
function loadFromCloud() {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "<p style='text-align:center'>📡 Connecting to Village Database...</p>";

    db.collection("traditions").orderBy("createdAt", "desc").get().then((snapshot) => {
        globalTraditions = []; // Reset Memory
        
        snapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; // Add ID to the object
            globalTraditions.push(data);
        });

        console.log("📦 Loaded " + globalTraditions.length + " stories.");
        renderList(globalTraditions); // Show everything initially
    });
}

// ➕ ADD or UPDATE TRADITION
function addTradition() {
    if (!currentUser) return alert("Please Login!");

    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;
    const fileInput = document.getElementById("newPhoto");
    const file = fileInput.files[0];

    if (!city || !title) return alert("City and Title are required!");

    // Helper: Saves to Firestore
    const saveToDB = (photoBase64) => {
        const payload = {
            city: city,
            title: title,
            date: date,
            desc: desc,
            author: currentUser.displayName,
            uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (photoBase64) payload.photo = photoBase64; // Add photo only if exists

        if (editId) {
            // Update
            db.collection("traditions").doc(editId).update(payload).then(() => {
                alert("Updated! ✅");
                resetForm();
                loadFromCloud();
            });
        } else {
            // Create New
            payload.likes = 0; // Initialize likes
            db.collection("traditions").add(payload).then(() => {
                alert("Published! 🎉");
                resetForm();
                loadFromCloud();
            });
        }
    };

    // Handle Photo Conversion
    if (file) {
        if (file.size > 1000000) return alert("Photo too big! Max 1MB.");
        const reader = new FileReader();
        reader.onload = (e) => saveToDB(e.target.result);
        reader.readAsDataURL(file);
    } else {
        saveToDB(null);
    }
}

// ==========================================
// 4. THE SMART SEARCH ALGORITHM 🧠
// ==========================================
function findTraditions() {
    const query = document.getElementById("cityInput").value.toLowerCase().trim();
    
    if (!query) {
        renderList(globalTraditions); // Show all if search is empty
        return;
    }

    // 1. SCORING LOGIC
    const scoredData = globalTraditions.map(item => {
        let score = 0;
        // Priority 1: Title or City Name (10 pts)
        if (item.title.toLowerCase().includes(query)) score += 10;
        if (item.city.toLowerCase().includes(query)) score += 10;
        
        // Priority 2: Description (1 pt)
        if (item.desc.toLowerCase().includes(query)) score += 1;

        return { ...item, score: score };
    });

    // 2. FILTER & SORT (Highest Score First)
    const matches = scoredData
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    // 3. DISPLAY
    renderList(matches, true); // true = show score colors
}

// ==========================================
// 5. UI RENDERING (Draws the Cards)
// ==========================================
function renderList(dataArray, showScore = false) {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    if (dataArray.length === 0) {
        resultList.innerHTML = "<p style='text-align:center'>❌ No traditions found.</p>";
        return;
    }

    dataArray.forEach(t => {
        // Color border based on score (Green=High, Orange=Low)
        let borderStyle = "none";
        if(showScore) {
            if(t.score >= 10) borderStyle = "4px solid #4CAF50"; // Green
            else if(t.score >= 1) borderStyle = "4px solid #FFC107"; // Yellow
        }

        // Check if current user owns this post
        let deleteBtn = "";
        if (currentUser && t.uid === currentUser.uid) {
            deleteBtn = `
                <button onclick="editTradition('${t.id}')" style="color:orange; background:none; border:none; cursor:pointer; margin-right:10px;">✎ Edit</button>
                <button onclick="deleteTradition('${t.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑 Delete</button>
            `;
        }

        const photoHTML = t.photo ? `<img src="${t.photo}">` : "";

        const card = `
            <div class="card" style="border-left: ${borderStyle};">
                <div style="display:flex; justify-content:space-between;">
                    <h3>${t.title}</h3>
                    <small style="background:#eee; padding:2px 5px; border-radius:5px;">${t.city}</small>
                </div>
                ${photoHTML}
                <p>${t.desc}</p>
                <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                    <button onclick="likeTradition('${t.id}')" style="background:none; border:1px solid #ddd; padding:5px 10px; border-radius:20px; cursor:pointer;">
                        ❤️ ${t.likes || 0}
                    </button>
                    <div>${deleteBtn}</div>
                </div>
                <small style="color:#999; display:block; margin-top:5px;">By ${t.author} | ${t.date}</small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}

// ==========================================
// 6. UTILS (Like, Delete, Reset, Nav)
// ==========================================

function likeTradition(id) {
    if(!currentUser) return alert("Login to like!");
    db.collection("traditions").doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).then(() => loadFromCloud()); // Refresh UI
}

function deleteTradition(id) {
    if(confirm("Delete this story?")) {
        db.collection("traditions").doc(id).delete().then(() => loadFromCloud());
    }
}

function editTradition(id) {
    window.scrollTo(0,0);
    showSection('add'); // Switch tab
    const item = globalTraditions.find(t => t.id === id);
    if(item) {
        document.getElementById("newCity").value = item.city;
        document.getElementById("newTitle").value = item.title;
        document.getElementById("newDesc").value = item.desc;
        document.getElementById("newDate").value = item.date;
        document.getElementById("submitBtn").innerText = "Update Tradition";
        editId = id;
    }
}

function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDesc").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newPhoto").value = "";
    document.getElementById("submitBtn").innerText = "Post Tradition";
    editId = null;
}

function showSection(id) {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("feedSection").style.display = "none";
    document.getElementById("addSection").style.display = "none";
    
    const active = document.getElementById(id+"Section");
    active.style.display = (id === 'home') ? 'flex' : 'flex';
    if(id === 'home') active.style.flexDirection = 'column';
    else active.style.justifyContent = 'center';
}
