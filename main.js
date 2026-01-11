/* ==================================================================
   VILLAGE CONNECT: FINAL ENGINE 🚀
   Features: Auth, Cloud DB, Smart Search, Smart Likes, Viral Share
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

// Initialize Firebase (Safely)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 🧠 GLOBAL MEMORY
let globalTraditions = [];
let currentUser = null; 
let editId = null;      

// ==========================================
// 2. STARTUP & AUTHENTICATION
// ==========================================

window.onload = function() {
    console.log("🚀 App Starting...");
    loadFromCloud(); // Download Data
};

// 👮 Monitor User Status
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById("navLoginBtn");
    const logoutBtn = document.getElementById("navLogoutBtn");
    const addBox = document.getElementById("addBox");
    const loginWarning = document.getElementById("loginWarning");
    const welcomeMsg = document.getElementById("welcomeMsg");

    if (user) {
        // LOGGED IN
        currentUser = user;
        if(loginBtn) loginBtn.style.display = "none";
        if(logoutBtn) logoutBtn.style.display = "block";
        if(addBox) addBox.style.display = "block";
        if(loginWarning) loginWarning.style.display = "none";
        if(welcomeMsg) welcomeMsg.innerText = "Hi, " + user.displayName + " 👋";
        renderList(globalTraditions); // Refresh for Red Hearts
    } else {
        // GUEST
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
        .catch((e) => alert("❌ Error: " + e.message));
}

function logout() {
    auth.signOut().then(() => location.reload());
}

// ==========================================
// 3. CORE: DOWNLOAD & SEARCH
// ==========================================

// ☁️ DOWNLOAD DATA
function loadFromCloud() {
    const resultList = document.getElementById("resultList");
    if(resultList) resultList.innerHTML = "<p style='text-align:center; color:#666;'>📡 Connecting to Database...</p>";

    // Note: Removed .orderBy to prevent crashes on old data. 
    db.collection("traditions").get()
    .then((snapshot) => {
        globalTraditions = []; 
        
        if (snapshot.empty) {
            renderList([]);
            return;
        }

        snapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; 
            globalTraditions.push(data);
        });

        renderList(globalTraditions); 
    })
    .catch((error) => {
        console.error("Error loading:", error);
        if(resultList) resultList.innerHTML = "<p style='color:red; text-align:center'>❌ Error loading data.</p>";
    });
}

// 🔍 SMART SEARCH
function findTraditions() {
    const query = document.getElementById("cityInput").value.toLowerCase().trim();
    
    if (!query) {
        renderList(globalTraditions); 
        return;
    }

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

    renderList(matches, true); 
}

// ==========================================
// 4. UI: RENDER LIST (With Share Button)
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
        // A. Score Border
        let borderStyle = "none";
        if(showScore) {
            if(t.score >= 10) borderStyle = "4px solid #4CAF50"; 
            else if(t.score >= 1) borderStyle = "4px solid #FFC107"; 
        }

        // B. Smart Like Logic
        const likesArray = t.likedBy || []; 
        const isLikedByMe = currentUser && likesArray.includes(currentUser.uid);
        const heartColor = isLikedByMe ? "#ff4444" : "#888"; 
        const heartIcon = isLikedByMe ? "❤️" : "🤍";
        const btnBorder = isLikedByMe ? "1px solid #ff4444" : "1px solid #ccc";

        // C. Owner Buttons
        let ownerBtns = "";
        if (currentUser && t.uid === currentUser.uid) {
            ownerBtns = `
                <button onclick="editTradition('${t.id}')" style="color:orange; background:none; border:none; cursor:pointer; margin-right:10px;">✎ Edit</button>
                <button onclick="deleteTradition('${t.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑 Delete</button>
            `;
        }

        // D. Photo
        const photoHTML = t.photo ? `<img src="${t.photo}" style="width:100%; border-radius:10px; margin:10px 0;">` : "";

        // E. Clean strings for Share function
        const cleanTitle = t.title ? t.title.replace(/'/g, "\\'") : "";
        const cleanCity = t.city ? t.city.replace(/'/g, "\\'") : "";
        const cleanDesc = t.desc ? t.desc.replace(/'/g, "\\'").replace(/\n/g, " ") : "";

        // F. Build Card
        const card = `
            <div class="card" style="border-left: ${borderStyle}; background:white; padding:15px; border-radius:15px; margin-top:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between;">
                    <h3 style="margin:0;">${t.title}</h3>
                    <small style="background:#eee; padding:2px 8px; border-radius:5px; height:fit-content;">${t.city}</small>
                </div>
                ${photoHTML}
                <p style="margin-top:10px; line-height:1.5;">${t.desc}</p>
                
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    
                    <div style="display:flex; gap:10px;">
                        <button onclick="likeTradition('${t.id}')" 
                                style="background:none; border:${btnBorder}; color:${heartColor}; padding:5px 12px; border-radius:20px; cursor:pointer; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:5px;">
                            ${heartIcon} ${t.likes || 0}
                        </button>
                        <button onclick="shareTradition('${cleanTitle}', '${cleanCity}', '${cleanDesc}')" 
                                style="background:#f0f2f5; border:none; color:#2a5298; padding:5px 12px; border-radius:20px; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:5px;">
                            📤 Share
                        </button>
                    </div>
                    
                    <div>${ownerBtns}</div>
                </div>
                
                <small style="color:#999; display:block; margin-top:10px; font-size:0.8rem;">
                    By ${t.author || "Guest"} • ${t.date || "Unknown"}
                </small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}

// ==========================================
// 5. ACTIONS: LIKE, SHARE, ADD, DELETE
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

// 📲 SHARE FUNCTION
function shareTradition(title, city, desc) {
    const shareData = {
        title: 'Village Connect 🇮🇳',
        text: `🌟 Check out "${title}" in ${city}!\n\n"${desc.substring(0, 80)}..."\n\nRead more on Village Connect! 🚀`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch((err) => console.log(err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`;
        window.open(whatsappUrl, '_blank');
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
            city: city, title: title, date: date, desc: desc,
            author: currentUser.displayName, uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (photoData) payload.photo = photoData;

        if (editId) {
            db.collection("traditions").doc(editId).update(payload).then(() => {
                alert("Updated! ✅"); resetForm(); loadFromCloud();
            });
        } else {
            payload.likes = 0; payload.likedBy = [];
            db.collection("traditions").add(payload).then(() => {
                alert("Published! 🎉"); resetForm(); loadFromCloud();
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
    if(confirm("Delete this?")) {
        db.collection("traditions").doc(id).delete().then(() => loadFromCloud());
    }
}

// ✎ EDIT POST
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

// 🔄 RESET & NAV
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
// ==========================================
// 🎤 VOICE SEARCH (Iron Man Mode)
// ==========================================
function startVoiceSearch() {
    // Check if browser supports it
    if (!('webkitSpeechRecognition' in window)) {
        alert("⚠️ Your browser doesn't support Voice Search. Try Chrome!");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US'; // You can change to 'en-IN' for Indian accent
    recognition.continuous = false;
    recognition.interimResults = false;

    // Visual Feedback
    const searchBox = document.getElementById("cityInput");
    searchBox.placeholder = "🎤 Listening... Speak now!";
    searchBox.style.border = "2px solid #ffcc00"; // Turn yellow when listening

    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        
        // 1. Fill the input
        searchBox.value = transcript;
        searchBox.placeholder = "Search (e.g. Rain, Pickle)...";
        searchBox.style.border = "1px solid #ddd"; // Reset border

        // 2. Auto-Run Search
        findTraditions();
        
        // 3. Cool Alert (Optional)
        // alert("🗣️ You said: " + transcript); 
    };

    recognition.onerror = function(event) {
        console.error("Voice Error:", event.error);
        searchBox.placeholder = "❌ Error. Try again.";
        searchBox.style.border = "1px solid red";
    };
}
