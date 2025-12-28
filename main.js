// --- 1. FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyBxnxa5ffRlelk3-SxBGemmnGFjkJ8mP2U",
  authDomain: "village-connect-dabff.firebaseapp.com",
  projectId: "village-connect-dabff",
  storageBucket: "village-connect-dabff.firebasestorage.app",
  messagingSenderId: "885677166072",
  appId: "1:885677166072:web:49ae174770de8d00a49a0d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // This is your Cloud Database

// --- 2. THE SEARCH FUNCTION (Cloud Version) ---
function findTraditions() {
    let input = document.getElementById("cityInput").value.trim().toLowerCase();
    let resultBox = document.getElementById("resultList");
    resultBox.innerHTML = "Loading from cloud..."; // Show loading state

    // Ask Firebase for data
    db.collection("traditions").where("city", "==", input)
    .get()
    .then((querySnapshot) => {
        resultBox.innerHTML = ""; // Clear loading text
        
        if (querySnapshot.empty) {
            resultBox.innerHTML = "<p>No traditions found. Add one!</p>";
        } else {
            // Loop through the cloud results
            querySnapshot.forEach((doc) => {
                let t = doc.data(); // This is the object {city, title, desc...}
                
                resultBox.innerHTML += `
                    <div class="card">
                        <h3>${t.title}</h3>
                        <p>${t.desc}</p>
                        <small>📅 ${t.date} | 📍 ${t.city.toUpperCase()}</small>
                    </div>
                `;
            });
        }
    })
    .catch((error) => {
        console.error("Error getting documents: ", error);
        resultBox.innerHTML = "Error connecting to server.";
    });
}

// --- 3. THE ADD FUNCTION (Cloud Version) ---
function addTradition() {
    let cityInput = document.getElementById("newCity").value.trim().toLowerCase();
    let titleInput = document.getElementById("newTitle").value.trim();
    let dateInput = document.getElementById("newDate").value;
    let descInput = document.getElementById("newDesc").value;

    if (cityInput === "" || titleInput === "") {
        alert("Please fill in the details!");
        return;
    }

    // Save to Firebase Cloud
    db.collection("traditions").add({
        city: cityInput,
        title: titleInput,
        desc: descInput,
        date: dateInput,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Time it was added
    })
    .then(() => {
        alert("Success! Saved to the Global Cloud.");
        
        // Clear Inputs
        document.getElementById("newCity").value = "";
        document.getElementById("newTitle").value = "";
        document.getElementById("newDate").value = "";
        document.getElementById("newDesc").value = "";
        
        // Auto Search
        document.getElementById("cityInput").value = cityInput;
        findTraditions();
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
        alert("Error saving: " + error.message);
    });
}
