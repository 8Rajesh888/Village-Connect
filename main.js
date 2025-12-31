// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 1. Authentication Listener
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("welcomeMsg").innerText = "Welcome, " + user.displayName;
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "block";
        document.getElementById("addbox").style.display = "block";
    } else {
        document.getElementById("welcomeMsg").innerText = "Welcome, Guest";
        document.getElementById("btnLogin").style.display = "block";
        document.getElementById("btnLogout").style.display = "none";
        document.getElementById("addbox").style.display = "none";
    }
});

// 2. Google Login
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => console.error(error));
}

// 3. Logout
function logout() {
    auth.signOut();
}

// 4. Add Tradition (Saves city name in lowercase for better searching)
function addTradition() {
    const city = document.getElementById("newCity").value.trim();
    const title = document.getElementById("newTitle").value;
    const date = document.getElementById("newDate").value;
    const desc = document.getElementById("newDesc").value;

    if (!city || !title) return alert("Please fill city and event name.");

    db.collection("traditions").add({
        city: city.toLowerCase(), // Store as lowercase for easy search
        displayCity: city,        // Keep original for display
        title: title,
        date: date,
        description: desc,
        author: auth.currentUser.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Tradition added!");
        // Clear fields
        document.getElementById("newCity").value = "";
        document.getElementById("newTitle").value = "";
        document.getElementById("newDate").value = "";
        document.getElementById("newDesc").value = "";
    });
}

// 5. Search Traditions
function findTraditions() {
    const searchCity = document.getElementById("cityInput").value.trim().toLowerCase();
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "Searching...";

    db.collection("traditions")
        .where("city", "==", searchCity)
        .get()
        .then(snapshot => {
            resultList.innerHTML = "";
            if (snapshot.empty) {
                resultList.innerHTML = "<p>No traditions found for this location.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                resultList.innerHTML += `
                    <div class="card">
                        <h3>${data.title}</h3>
                        <p>${data.description}</p>
                        <small>📍 ${data.displayCity} | 📅 ${data.date}</small><br>
                        <small>Shared by: ${data.author}</small>
                    </div>
                `;
            });
        }).catch(err => {
            console.error(err);
            resultList.innerHTML = "Error loading data.";
        });
}