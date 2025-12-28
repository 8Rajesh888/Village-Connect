// 1. THE DATABASE LOADER (The Brain)
// Check: Do we have saved data in the phone?
let savedData = localStorage.getItem("villageData");

let traditions = [];

if (savedData) {
    // Yes! Load the saved data
    traditions = JSON.parse(savedData);
} else {
    // No. First time user? Load default data.
    traditions = [
        {
            city: "kavutaram",
            title: "Sankranti Kite Festival",
            desc: "The whole village gathers at the High School grounds. We distribute Ariselu sweets.",
            date: "Jan 14"
        },
        {
            city: "kavutaram",
            title: "Village Goddess Fair",
            desc: "Annual jatara starts. Don't miss the Prabhalu procession.",
            date: "April 10"
        },
        {
            city: "vijayawada",
            title: "Krishna Pushkaralu",
            desc: "Holy dip in the Krishna river. Ghats are decorated with lights.",
            date: "Every 12 Years"
        },
        {
            city: "hyderabad",
            title: "Ramadan Night Bazaar",
            desc: "Charminar area stays open all night with Haleem and bangles shopping.",
            date: "Ramadan Month"
        }
    ];
}

// 2. THE SEARCH FUNCTION
function findTraditions() {
    let input = document.getElementById("cityInput").value;
    let searchCity = input.toLowerCase().trim(); // Trim spaces!
    let resultBox = document.getElementById("resultList");
    
    resultBox.innerHTML = "";
    let found = false;
    
    for(let i = 0; i < traditions.length; i++) {
        let t = traditions[i];
        if (t.city === searchCity) {
            resultBox.innerHTML += `
                <div class="card">
                    <h3>${t.title}</h3>
                    <p>${t.desc}</p>
                    <small>📅 ${t.date} | 📍 ${t.city.toUpperCase()}</small>
                </div>
            `;
            found = true;
        }
    }

    if (!found) {
        resultBox.innerHTML = "<p>No traditions found. Be the first to add one!</p>";
    }
}

// 3. THE ADD FUNCTION (With Memory!)
function addTradition() {
    let cityInput = document.getElementById("newCity").value.trim();
    let titleInput = document.getElementById("newTitle").value.trim();
    let dateInput = document.getElementById("newDate").value;
    let descInput = document.getElementById("newDesc").value;

    if (cityInput === "" || titleInput === "") {
        alert("Please fill in the details!");
        return;
    }

    let newTradition = {
        city: cityInput.toLowerCase(), 
        title: titleInput,
        desc: descInput,
        date: dateInput
    };

    // Push to Array
    traditions.push(newTradition);

    // --- SAVE TO PHONE MEMORY ---
    // This line saves the updated array to the phone's hard drive
    localStorage.setItem("villageData", JSON.stringify(traditions));

    alert("Success! Added " + titleInput + " to " + cityInput);

    // Clear inputs
    document.getElementById("newCity").value = "";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDate").value = "";
    document.getElementById("newDesc").value = "";
    
    // Auto-Search
    document.getElementById("cityInput").value = cityInput;
    findTraditions(); 
}
