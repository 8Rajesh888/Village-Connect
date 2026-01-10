/* ==================================================================
   VILLAGE CONNECT: COMPLETE ENGINE (Fixed & Merged)
   Contains: Firebase Init, Smart Search, Smart Likes, Auth
   ================================================================== */

// 1. FIREBASE CONFIGURATION (Your Specific Keys)
const firebaseConfig = {
    apiKey: "AIzaSyBxnxa5ffRlelk3-SxBGemmnGFjkJ8mP2U",
    authDomain: "village-connect-dabff.firebaseapp.com",
    projectId: "village-connect-dabff",
    storageBucket: "village-connect-dabff.firebasestorage.app",
    messagingSenderId: "885677166072",
    appId: "1:885677166072:web:49ae174770de8d00a49a0d"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 🧠 GLOBAL MEMORY (Stores data for fast searching)
let globalTraditions = [];
let currentUser = null; 
let editId = null;      

// ==========================================
// 2. STARTUP & AUTHENTICATION
// ==========================================

// Run this immediately when page loads
window.onload = function() {
    console.log("🚀 App Starting...");
    loadFromCloud(); // Download Data
};

// 👮 Monitor Login Status
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById("navLoginBtn");
    const logoutBtn = document.getElementById("navLogoutBtn");
    const addBox = document.getElementById("addBox");
    const loginWarning = document.getElementById("loginWarning");
    const welcomeMsg = document.getElementById("welcomeMsg");

    if (user) {
        // User is LOGGED IN
        console.log("👤 User:", user.displayName);
        currentUser = user;
        if(loginBtn) loginBtn.style.display = "none";
        if(logoutBtn) logoutBtn.style.display = "block";
        if(addBox) addBox.style.display = "block";
        if(loginWarning) loginWarning.style.display = "none";
        if(welcomeMsg) welcomeMsg.innerText = "Hi, " + user.displayName + " 👋";
        
        // Reload list to update Red Hearts
        renderList(globalTraditions);
    } else {
        // User is GUEST
        console.log("👤 Guest Mode");
        currentUser = null;
        if(loginBtn) loginBtn.style.display = "block";
        if(logoutBtn) logoutBtn.style.display = "none";
        if(addBox) addBox.style.display = "none";
        if(loginWarning) loginWarning.style.display = "block";
        if(welcomeMsg) welcomeMsg.innerText = "Welcome, Guest";
        
        // Reload list to remove Red Hearts
        renderList(globalTraditions);
    }
});

// Login Function
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => alert("✅ Login Success!"))
        .catch((e) => alert("❌ Error: " + e.message));
}

// Logout Function
function logout() {
    auth.signOut().then(() => location.reload());
}

// ==========================================
// 3. CORE: DOWNLOAD & SEARCH
// ==========================================

// ☁️ DOWNLOAD DATA
function loadFromCloud() {
    const resultList = document.getElementById("resultList");
    if(resultList) resultList.innerHTML = "<p style='text-align:center; color:#666;'>📡 Connecting to Village Database...</p>";

    db.collection("traditions").orderBy("createdAt", "desc").get()
    .then((snapshot) => {
        globalTraditions = []; // Clear memory
        
        if (snapshot.empty) {
            console.log("⚠️ No data found in Firestore.");
            renderList([]);
            return;
        }

        snapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; // Attach ID
            globalTraditions.push(data);
        });

        console.log("📦 Loaded " + globalTraditions.length + " stories.");
        renderList(globalTraditions); // Show them
    })
    .catch((error) => {
        console.error("Error loading data:", error);
        if(resultList) resultList.innerHTML = "<p style='color:red; text-align:center'>❌ Error loading data. Check Internet.</p>";
    });
}

// 🔍 SMART SEARCH
function findTraditions() {
    const query = document.getElementById("cityInput").value.toLowerCase().trim();
    
    if (!query) {
        renderList(globalTraditions); // Reset if empty
        return;
    }

    // Scoring Logic
    const scoredData = globalTraditions.map(item => {
        let score = 0;
        // Priority 1: Title or City (10 pts)
        if (item.title && item.title.toLowerCase().includes(query)) score += 10;
        if (item.city && item.city.toLowerCase().includes(query)) score += 10;
        // Priority 2: Description (1 pt)
        if (item.desc && item.desc.toLowerCase().includes(query)) score += 1;

        return { ...item, score: score };
    });

    // Filter & Sort
    const matches = scoredData
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    renderList(matches, true); // Show with ranking colors
}

// ==========================================
// 4. UI: RENDER LIST (The Visuals)
// ==========================================
function renderList(dataArray, showScore = false) {
    const resultList = document.getElementById("resultList");
    if(!resultList) return;
    
    resultList.innerHTML = "";

    if (dataArray.length === 0) {
        resultList.innerHTML = "<p style='text-align:center; margin-top:20px;'>❌ No stories found.</p>";
        return;
    }

    dataArray.forEach(t => {
        // A. Score Border (Green/Yellow)
        let borderStyle = "none";
        if(showScore) {
            if(t.score >= 10) borderStyle = "4px solid #4CAF50"; 
            else if(t.score >= 1) borderStyle = "4px solid #FFC107"; 
        }

        // B. Smart Like Button (Red or Grey)
        const likesArray = t.likedBy || []; 
        const isLikedByMe = currentUser && likesArray.includes(currentUser.uid);
        
        const heartColor = isLikedByMe ? "#ff4444" : "#888"; 
        const heartIcon = isLikedByMe ? "❤️" : "🤍";
        const btnBorder = isLikedByMe ? "1px solid #ff4444" : "1px solid #ccc";

        // C. Edit/Delete Buttons (Owner Only)
        let ownerBtns = "";
        if (currentUser && t.uid === currentUser.uid) {
            ownerBtns = `
                <button onclick="editTradition('${t.id}')" style="color:orange; background:none; border:none; cursor:pointer; margin-right:10px;">✎ Edit</button>
                <button onclick="deleteTradition('${t.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑 Delete</button>
            `;
        }

        // D. Photo
        const photoHTML = t.photo ? `<img src="${t.photo}" style="width:100%; border-radius:10px; margin:10px 0;">` : "";

        // E. Build HTML
        const card = `
            <div class="card" style="border-left: ${borderStyle}; background:white; padding:15px; border-radius:15px; margin-top:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between;">
                    <h3 style="margin:0;">${t.title}</h3>
                    <small style="background:#eee; padding:2px 8px; border-radius:5px; height:fit-content;">${t.city}</small>
                </div>
                
                ${photoHTML}
                
                <p style="margin-top:10px; line-height:1.5;">${t.desc}</p>
                
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <button onclick="likeTradition('${t.id}')" 
                            style="background:none; border:${btnBorder}; color:${heartColor}; padding:5px 15px; border-radius:20px; cursor:pointer; font-weight:bold; transition:0.2s;">
                        ${heartIcon} ${t.likes || 0}
                    </button>
                    
                    <div>${ownerBtns}</div>
                </div>
                
                <small style="color:#999; display:block; margin-top:10px; font-size:0.8rem;">
                    By ${t.author || "Guest"} • ${t.date || "Unknown Date"}
                </small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}

// ==========================================
// 5. ACTIONS: ADD, LIKE, DELETE
// ==========================================

// ❤️ TOGGLE LIKE
function likeTradition(id) {
    if (!currentUser) return alert("🔒 Please Login to like!");

    const post = globalTraditions.find(p => p.id === id);
    if (!post) return;

    const likesArray = post.likedBy || [];
    const alreadyLiked = likesArray.includes(currentUser.uid);
    const docRef = db.collection("traditions").doc(id);

    if (alreadyLiked) {
        // UNLIKE
        docRef.update({
            likes: firebase.firestore.FieldValue.increment(-1),
            likedBy: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        }).then(() => loadFromCloud());
    } else {
        // LIKE
        docRef.update({
            likes: firebase.firestore.FieldValue.increment(1),
            likedBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        }).then(() => loadFromCloud());
    }
}

// ➕ ADD POST
function addTradition() {
    if (!currentUser) return alert("Please Login!");

    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;
    const fileInput = document.getElementById("newPhoto");
    const file = fileInput.files[0];

    if (!city || !title) return alert("City and Title are required!");

    const saveToDB = (photoData) => {
        const payload = {
            city: city,
            title: title,
            date: date,
            desc: desc,
            author: currentUser.displayName,
            uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (photoData) payload.photo = photoData;

        if (editId) {
            db.collection("traditions").doc(editId).update(payload).then(() => {
                alert("Updated! ✅");
                resetForm();
                loadFromCloud();
            });
        } else {
            payload.likes = 0;
            payload.likedBy = [];
            db.collection("traditions").add(payload).then(() => {
                alert("Published! 🎉");
                resetForm();
                loadFromCloud();
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

// 🗑 DELETE POST
function deleteTradition(id) {
    if(confirm("Are you sure?")) {
        db.collection("traditions").doc(id).delete().then(() => loadFromCloud());
    }
}

// ✎ EDIT POST (Pre-fill form)
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

// 🔄 RESET FORM
function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDesc").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newPhoto").value = "";
    document.getElementById("submitBtn").innerText = "Post Tradition";
    editId = null;
}

// 🧭 NAV SWITCHER
function showSection(id) {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("feedSection").style.display = "none";
    document.getElementById("addSection").style.display = "none";
    
    const active = document.getElementById(id+"Section");
    active.style.display = "flex";
    if(id === 'home') active.style.flexDirection = 'column';
    else active.style.justifyContent = 'center';
}
