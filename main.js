/* ==================================================================
   VILLAGE CONNECT: DEBUG VERSION 🛠️
   (Use this to fix "Nothing is working")
   ================================================================== */

// 1. FIREBASE CONFIGURATION
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
    console.log("🔥 Firebase Initialized");
}
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
let globalTraditions = [];
let currentUser = null; 
let editId = null;      

// ==========================================
// 2. STARTUP (With Debug Alerts)
// ==========================================

window.onload = function() {
    // alert("🚀 App Started! Checking Connection..."); // Uncomment if completely dead
    loadFromCloud();
};

// 👮 Monitor User
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById("navLoginBtn");
    const logoutBtn = document.getElementById("navLogoutBtn");
    const addBox = document.getElementById("addBox");
    const loginWarning = document.getElementById("loginWarning");
    const welcomeMsg = document.getElementById("welcomeMsg");

    if (user) {
        currentUser = user;
        if(loginBtn) loginBtn.style.display = "none";
        if(logoutBtn) logoutBtn.style.display = "block";
        if(addBox) addBox.style.display = "block";
        if(loginWarning) loginWarning.style.display = "none";
        if(welcomeMsg) welcomeMsg.innerText = "Hi, " + user.displayName + " 👋";
        renderList(globalTraditions); // Refresh to show Red Hearts
    } else {
        currentUser = null;
        if(loginBtn) loginBtn.style.display = "block";
        if(logoutBtn) logoutBtn.style.display = "none";
        if(addBox) addBox.style.display = "none";
        if(loginWarning) loginWarning.style.display = "block";
        if(welcomeMsg) welcomeMsg.innerText = "Welcome, Guest";
        renderList(globalTraditions);
    }
});

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => alert("✅ Login Success!"))
        .catch((e) => alert("❌ Login Error: " + e.message));
}

function logout() {
    auth.signOut().then(() => location.reload());
}

// ==========================================
// 3. CORE FUNCTIONS (Fixed)
// ==========================================

function loadFromCloud() {
    const resultList = document.getElementById("resultList");
    if(resultList) resultList.innerHTML = "<p style='text-align:center'>📡 Connecting to Database...</p>";

    // ⚠️ CHANGED: Removed .orderBy() to prevent crashes with old data
    // ⚠️ CHANGED: Collection name is 'traditions' (Make sure your DB matches this!)
    db.collection("traditions").get()
    .then((snapshot) => {
        globalTraditions = []; 
        
        if (snapshot.empty) {
            // alert("⚠️ Database Connected, but it is EMPTY.");
            renderList([]);
            return;
        }

        snapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; 
            globalTraditions.push(data);
        });

        // alert("📦 Loaded " + globalTraditions.length + " stories!");
        renderList(globalTraditions); 
    })
    .catch((error) => {
        alert("❌ DATA ERROR: " + error.message + "\n\nCHECK: 1. Internet? 2. Firestore Rules set to true?");
    });
}

function renderList(dataArray, showScore = false) {
    const resultList = document.getElementById("resultList");
    if(!resultList) return;
    resultList.innerHTML = "";

    if (dataArray.length === 0) {
        resultList.innerHTML = "<p style='text-align:center; margin-top:20px;'>❌ No traditions found.</p>";
        return;
    }

    dataArray.forEach(t => {
        // Score Border
        let borderStyle = "none";
        if(showScore) {
            if(t.score >= 10) borderStyle = "4px solid #4CAF50"; 
            else if(t.score >= 1) borderStyle = "4px solid #FFC107"; 
        }

        // ❤️ SMART LIKE LOGIC
        const likesArray = t.likedBy || []; 
        const isLikedByMe = currentUser && likesArray.includes(currentUser.uid);
        const heartColor = isLikedByMe ? "#ff4444" : "#888"; 
        const heartIcon = isLikedByMe ? "❤️" : "🤍";
        const btnBorder = isLikedByMe ? "1px solid #ff4444" : "1px solid #ccc";

        // Owner Buttons
        let ownerBtns = "";
        if (currentUser && t.uid === currentUser.uid) {
            ownerBtns = `
                <button onclick="editTradition('${t.id}')" style="color:orange; background:none; border:none; cursor:pointer; margin-right:10px;">✎ Edit</button>
                <button onclick="deleteTradition('${t.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑 Delete</button>
            `;
        }

        const photoHTML = t.photo ? `<img src="${t.photo}" style="width:100%; border-radius:10px; margin:10px 0;">` : "";

        const card = `
            <div class="card" style="border-left: ${borderStyle}; background:white; padding:15px; border-radius:15px; margin-top:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between;">
                    <h3 style="margin:0;">${t.title}</h3>
                    <small style="background:#eee; padding:2px 8px; border-radius:5px; height:fit-content;">${t.city}</small>
                </div>
                ${photoHTML}
                <p style="margin-top:10px;">${t.desc}</p>
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <button onclick="likeTradition('${t.id}')" 
                            style="background:none; border:${btnBorder}; color:${heartColor}; padding:5px 15px; border-radius:20px; cursor:pointer; transition:0.2s;">
                        ${heartIcon} ${t.likes || 0}
                    </button>
                    <div>${ownerBtns}</div>
                </div>
                <small style="color:#999; display:block; margin-top:10px;">By ${t.author || "Guest"}</small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}

function likeTradition(id) {
    if (!currentUser) return alert("Please Login to like!");

    const post = globalTraditions.find(p => p.id === id);
    if (!post) return;

    const likesArray = post.likedBy || [];
    const alreadyLiked = likesArray.includes(currentUser.uid);
    const docRef = db.collection("traditions").doc(id);

    if (alreadyLiked) {
        docRef.update({
            likes: firebase.firestore.FieldValue.increment(-1),
            likedBy: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        }).then(() => loadFromCloud());
    } else {
        docRef.update({
            likes: firebase.firestore.FieldValue.increment(1),
            likedBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        }).then(() => loadFromCloud());
    }
}

// Actions
function addTradition() {
    if (!currentUser) return alert("Please Login!");

    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;
    const fileInput = document.getElementById("newPhoto");
    const file = fileInput.files[0];

    if (!city || !title) return alert("City & Title required!");

    const saveToDB = (photoData) => {
        const payload = {
            city: city, title: title, date: date, desc: desc,
            author: currentUser.displayName, uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Ensure likedBy exists for new posts
            likes: 0, likedBy: [] 
        };
        if (photoData) payload.photo = photoData;

        if (editId) {
            db.collection("traditions").doc(editId).update(payload).then(() => {
                alert("Updated!"); resetForm(); loadFromCloud();
            });
        } else {
            db.collection("traditions").add(payload).then(() => {
                alert("Posted!"); resetForm(); loadFromCloud();
            });
        }
    };

    if (file) {
        if(file.size > 1000000) return alert("Image too big (Max 1MB)");
        const reader = new FileReader();
        reader.onload = (e) => saveToDB(e.target.result);
        reader.readAsDataURL(file);
    } else {
        saveToDB(null);
    }
}

function deleteTradition(id) {
    if(confirm("Delete this?")) {
        db.collection("traditions").doc(id).delete().then(() => loadFromCloud());
    }
}

function editTradition(id) {
    const item = globalTraditions.find(t => t.id === id);
    if(item) {
        showSection('add');
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
    active.style.display = "flex";
    if(id === 'home') active.style.flexDirection = 'column';
    else active.style.justifyContent = 'center';
}

function findTraditions() {
    const query = document.getElementById("cityInput").value.toLowerCase().trim();
    if (!query) { renderList(globalTraditions); return; }

    const scoredData = globalTraditions.map(item => {
        let score = 0;
        if (item.title && item.title.toLowerCase().includes(query)) score += 10;
        if (item.city && item.city.toLowerCase().includes(query)) score += 10;
        if (item.desc && item.desc.toLowerCase().includes(query)) score += 1;
        return { ...item, score: score };
    });

    const matches = scoredData.filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    renderList(matches, true); 
}
