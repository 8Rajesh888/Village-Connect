// --- 1. FIREBASE CONFIG (Your Real Keys 🔑) ---
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

// --- 2. CATCH LOGIN ERRORS (The Debugger 🐞) ---
// This checks if you just came back from Google and if it worked
auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log("Success! Logged in as: " + result.user.displayName);
        }
    })
    .catch((error) => {
        // This alert will tell us exactly why the live site fails!
        alert("LOGIN ERROR: " + error.code + "\n" + error.message);
        console.error(error);
    });

// --- 3. UI LISTENER (Open/Close Gates) ---
auth.onAuthStateChanged((user) => {
    // We use YOUR real IDs here: 'welcomeGate' and 'mainApp'
    const gate = document.getElementById("welcomeGate");
    const app = document.getElementById("mainApp");
    const addBox = document.getElementById("addBox");
    
    if (user) {
        // 🟢 LOGGED IN
        if(gate) gate.style.display = "none";
        if(app) app.style.display = "block";
        document.getElementById("welcomeMsg").innerText = "Hi, " + user.displayName;
        
        // Hide small login button, show logout
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "inline-block";
        
        // Show the Add Form
        if(addBox) addBox.style.display = "block";
        
    } else {
        // 🔴 LOGGED OUT
        // We stay at the gate (or let the user click "View as Guest")
        // Note: We don't force the gate open here so the "Sign In" button stays visible
        
        document.getElementById("welcomeMsg").innerText = "Guest Mode";
        document.getElementById("btnLogin").style.display = "inline-block";
        document.getElementById("btnLogout").style.display = "none";
        
        // Hide the Add Form
        if(addBox) addBox.style.display = "none";
    }
});

// --- 4. GOOGLE LOGIN (Redirect Mode) ---
// --- 4. GOOGLE LOGIN (Back to Popup Mode) ---
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // We use POPUP now because we fixed the settings!
    // It is much better at "Remembering" you on localhost.
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login Success!", result.user);
            // The listener will automatically open the gate
        })
        .catch((error) => {
            // If the popup is blocked, this will tell us
            alert("Login Failed: " + error.message);
            console.error(error);
        });
}

// --- 5. LOGOUT ---
function logout() {
    auth.signOut().then(() => window.location.reload());
}

// --- 6. GUEST MODE ---
function enterAsGuest() {
    document.getElementById("welcomeGate").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
}

// --- 7. ADD TRADITION ---
function addTradition() {
    if (!auth.currentUser) return alert("Please login first");
    
    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value.trim();
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;

    if (!city || !title) return alert("Please fill in City and Title");

    db.collection("traditions").add({
        city: city.toLowerCase(), // stored lowercase for search
        displayCity: city,        // stored normal for display
        title: title,
        date: date,
        desc: desc, // Note: your HTML used 'desc', make sure it matches
        author: auth.currentUser.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Shared successfully!");
        location.reload();
    }).catch(err => alert("Save Error: " + err.message));
}
