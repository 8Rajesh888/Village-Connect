/* ==================================================================
   VILLAGE CONNECT: GOLDEN MASTER ENGINE 🚀
   Verified by: Lia (Ghost Shell Mentor)
   ================================================================== */

// ==========================================
// 1. GLOBAL VARIABLES & CONFIG
// ==========================================
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

// 🧠 APP MEMORY
let globalTraditions = []; // Stores loaded data
let currentFilter = 'All'; // Tracks active category
let editingId = null;      // Tracks if we are editing (null = new post)
let currentUser = null;    // Tracks logged-in user

// ==========================================
// 2. STARTUP & AUTHENTICATION
// ==========================================

window.onload = function() {
    console.log("🚀 App Starting...");
    loadFromCloud(); // Initial Load
    
    // Theme Check
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        const btn = document.getElementById("themeBtn");
        if(btn) btn.innerText = "☀️";
    }
};

// Monitor User Login Status
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
        
        // Refresh list to show Red Hearts for liked posts
        if(globalTraditions.length > 0) renderList(globalTraditions);
    } else {
        currentUser = null;
        if(loginBtn) loginBtn.style.display = "block";
        if(logoutBtn) logoutBtn.style.display = "none";
        if(addBox) addBox.style.display = "none";
        if(loginWarning) loginWarning.style.display = "block";
        if(welcomeMsg) welcomeMsg.innerText = "Welcome, Guest";
        if(globalTraditions.length > 0) renderList(globalTraditions);
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
// 3. CORE: DOWNLOAD, SEARCH & FILTER
// ==========================================

function loadFromCloud() {
    const resultList = document.getElementById("resultList");
    if(resultList) resultList.innerHTML = "<p style='text-align:center;'>📡 Connecting to Cloud...</p>";

    db.collection("traditions").orderBy("timestamp", "desc").get()
    .then((snapshot) => {
        globalTraditions = [];
        snapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; 
            globalTraditions.push(data);
        });
        renderList(globalTraditions);
    })
    .catch((error) => {
        console.error("Load Error:", error);
        // Fallback (Sometimes orderBy fails if index is missing)
        db.collection("traditions").get().then((snap) => {
            globalTraditions = [];
            snap.forEach((doc) => { let d = doc.data(); d.id = doc.id; globalTraditions.push(d); });
            renderList(globalTraditions);
        });
    });
}

// 🎯 FILTER BUTTON CLICK
function filterBy(category) {
    currentFilter = category;
    
    // Visual Update
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.remove('active-chip');
        if(btn.innerText === category) btn.classList.add('active-chip');
    });

    findTraditions(); // Re-run search/filter logic
}

// 🔍 SEARCH LOGIC
function findTraditions() {
    const query = document.getElementById("cityInput").value.toLowerCase().trim();
    
    // If we have no data yet, try loading again
    if(globalTraditions.length === 0) { loadFromCloud(); return; }

    const filtered = globalTraditions.filter(item => {
        // 1. Check Category
        let itemCat = item.category || "General";
        if (currentFilter !== 'All' && itemCat !== currentFilter) return false;

        // 2. Check Search Text
        if (!query) return true;
        
        // Simple search check
        return (item.title && item.title.toLowerCase().includes(query)) ||
               (item.city && item.city.toLowerCase().includes(query)) ||
               (item.desc && item.desc.toLowerCase().includes(query));
    });

    renderList(filtered);
}

// ==========================================
// 4. UI: RENDER CARDS
// ==========================================

function renderList(dataArray) {
    const resultList = document.getElementById("resultList");
    if(!resultList) return;
    
    resultList.innerHTML = "";

    if (dataArray.length === 0) {
        resultList.innerHTML = `<p style='text-align:center; margin-top:20px; color:#666;'>
            ❌ No stories found in <b>${currentFilter}</b>.
        </p>`;
        return;
    }

    dataArray.forEach(t => {
        let postCategory = t.category || "General";
        const likesArray = t.likedBy || []; 
        const isLikedByMe = currentUser && likesArray.includes(currentUser.uid);
        const heartIcon = isLikedByMe ? "❤️" : "🤍";

        let ownerBtns = "";
        if (currentUser && t.uid === currentUser.uid) {
            ownerBtns = `
                <button onclick="editTradition('${t.id}')" style="color:orange; background:none; border:none; cursor:pointer; margin-right:10px;">✎</button>
                <button onclick="deleteTradition('${t.id}')" style="color:red; background:none; border:none; cursor:pointer;">🗑</button>
            `;
        }

        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(t.title + " India tradition")}&tbm=isch`;

        // --- NEW: Comment Section Structure ---
        const card = `
            <div class="card">
                <div style="display:flex; justify-content:space-between;">
                    <h3 style="margin:0;">${t.title}</h3>
                    <small style="background:#eee; padding:2px 8px; border-radius:5px; height:fit-content; color:black;">${t.city}</small>
                </div>

                <span style="font-size:0.7rem; background:#e0f2f1; color:#00695c; padding:3px 8px; border-radius:10px;">${postCategory}</span>

                <a href="${googleSearchUrl}" target="_blank" class="image-btn">
                    🖼️ See Photos
                </a>

                <p style="margin-top:10px; color:#333;">${t.desc}</p>
                
                <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px;">
                        <button style="background:none; border:1px solid #ddd; padding:5px 12px; border-radius:20px;">
                            ${heartIcon} ${t.likes || 0}
                        </button>
                        
                        <button onclick="toggleComments('${t.id}')" style="background:#fff3e0; border:none; color:#e65100; padding:5px 12px; border-radius:20px; cursor:pointer;">
                            💬 Discuss
                        </button>

                        <button onclick="shareTradition('${t.title}', '${t.city}')" style="background:#f0f2f5; border:none; color:#2a5298; padding:5px 12px; border-radius:20px; cursor:pointer;">
                            📤
                        </button>
                    </div>
                    <div>${ownerBtns}</div>
                </div>

                <div id="comments-${t.id}" class="comment-section">
                    <div id="list-${t.id}">Loading thoughts...</div>
                    <div class="comment-input-area">
                        <input type="text" id="input-${t.id}" placeholder="Add a memory...">
                        <button class="send-btn" onclick="postComment('${t.id}')">➤</button>
                    </div>
                </div>
                
                <small style="color:#999; display:block; margin-top:10px; font-size:0.8rem;">
                    By ${t.author || "Guest"}
                </small>
            </div>
        `;
        resultList.innerHTML += card;
    });
}

// ==========================================
// 5. ADD / UPDATE / DELETE / SHARE
// ==========================================

function addTradition() {
    if (!currentUser) { alert("🔒 Login first!"); return; }

    const city = document.getElementById("newCity").value;
    const title = document.getElementById("newTitle").value;
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;
    const category = document.getElementById("categoryInput").value; 

    if (!city || !title) { alert("⚠️ Enter City & Title"); return; }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;

    if (editingId) {
        // === UPDATE ===
        submitBtn.innerText = "Updating... 🔄";
        db.collection("traditions").doc(editingId).update({
            city: city, title: title, date: date, desc: desc, category: category
        }).then(() => {
            alert("✅ Updated!");
            finishSubmit();
        });
    } else {
        // === CREATE ===
        submitBtn.innerText = "Posting... ⏳";
        db.collection("traditions").add({
            uid: currentUser.uid, author: currentUser.displayName,
            city: city, title: title, date: date, desc: desc, category: category,
            likes: 0, likedBy: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("✅ Posted!");
            finishSubmit();
        });
    }
}

function finishSubmit() {
    resetForm();
    showSection('feed');
    loadFromCloud(); // Reload data
}

function editTradition(id) {
    const post = globalTraditions.find(t => t.id === id);
    if (!post) return;

    document.getElementById("newCity").value = post.city;
    document.getElementById("newTitle").value = post.title;
    document.getElementById("newDate").value = post.date;
    document.getElementById("newDesc").value = post.desc;
    document.getElementById("categoryInput").value = post.category || "General";

    editingId = id; // Set Tracker
    document.getElementById("submitBtn").innerText = "Update Tradition 🔄";
    showSection('add');
}

function deleteTradition(id) {
    if(confirm("Delete this?")) {
        db.collection("traditions").doc(id).delete()
        .then(() => {
            alert("🗑 Deleted");
            loadFromCloud();
        });
    }
}

function resetForm() {
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDesc").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("categoryInput").value = "General";
    
    document.getElementById("submitBtn").innerText = "Post Tradition";
    document.getElementById("submitBtn").disabled = false;
    editingId = null; // Clear Tracker
}

function shareTradition(title, city) {
    const text = `Check out this tradition from ${city}: ${title} 🇮🇳 on Village Connect!`;
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href });
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
}

// ==========================================
// 6. UTILS (Nav, Theme, Voice)
// ==========================================

function showSection(id) {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("feedSection").style.display = "none";
    document.getElementById("addSection").style.display = "none";
    
    const active = document.getElementById(id+"Section");
    active.style.display = "flex";
    if(id === 'home') active.style.flexDirection = 'column';
    else if(id === 'feed') active.style.display = "block"; // Feed is block, not flex
    else active.style.flexDirection = 'column';
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("themeBtn").innerText = isDark ? "☀️" : "🌙";
}

function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("⚠️ Use Chrome for Voice Search."); return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    const searchBox = document.getElementById("cityInput");
    searchBox.placeholder = "🎤 Listening...";
    
    recognition.onresult = function(e) {
        searchBox.value = e.results[0][0].transcript;
        findTraditions();
        searchBox.placeholder = "Search...";
    };
    recognition.start();
}
// ==========================================
// 7. COMMENTS LOGIC (NEW)
// ==========================================

// 1. Show/Hide the comment box and load data
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    
    if (section.style.display === "block") {
        section.style.display = "none"; // Hide if open
    } else {
        section.style.display = "block"; // Show
        loadComments(postId); // Fetch from Firebase
    }
}

// 2. Post a new comment
function postComment(postId) {
    if (!currentUser) { alert("Please login to comment!"); return; }
    
    const input = document.getElementById(`input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    // Add to a 'sub-collection' in Firestore
    db.collection("traditions").doc(postId).collection("comments").add({
        text: text,
        author: currentUser.displayName,
        uid: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        input.value = ""; // Clear box
        loadComments(postId); // Refresh list
    });
}

// 3. Load comments from Cloud
function loadComments(postId) {
    const listDiv = document.getElementById(`list-${postId}`);
    
    db.collection("traditions").doc(postId).collection("comments")
      .orderBy("timestamp", "asc")
      .get()
      .then(snapshot => {
          listDiv.innerHTML = "";
          if (snapshot.empty) {
              listDiv.innerHTML = "<small style='color:#999'>No thoughts yet. Be the first!</small>";
              return;
          }

          snapshot.forEach(doc => {
              const c = doc.data();
              listDiv.innerHTML += `
                  <div class="comment-box">
                      <div class="comment-author">${c.author}</div>
                      <div>${c.text}</div>
                  </div>
              `;
          });
      });
}
