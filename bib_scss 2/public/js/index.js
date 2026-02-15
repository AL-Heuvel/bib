// Functie om alle items op te halen en tonen
async function laadItems() {
    const res = await fetch("/items");
    const data = await res.json();

    // Sorteer op ID aflopend (nieuwste eerst)
    data.sort((a, b) => b.id - a.id);

    const lijst = document.getElementById("lijst");
    lijst.innerHTML = "";

    data.forEach(item => {
        lijst.innerHTML += `
            <div class="card">
                <img src="${item.afbeelding || 'https://via.placeholder.com/250'}" alt="">
                <div class="card-content">
                    <h3>${item.titel}</h3>
                    <p><strong>Type:</strong> ${item.type}</p>
                    <p><strong>Genres:</strong> ${item.genres}</p>
                    <p>${item.beschrijving}</p>
                    <p><strong>Rating:</strong> ${item.rating !== null ? item.rating : "N/A"}/10</p>
                    ${item.bron ? `<p><strong>Origineel:</strong> <a href="${item.bron}" target="_blank" rel="noopener">Link</a></p>` : ""}
                    <a href="update.html?id=${item.id}" class="btn-edit">Bewerken</a>
                    <button onclick="verwijderItem(${item.id})">Verwijderen</button>
                </div>
            </div>
        `;
    });
}
const typeSelect = document.getElementById("type");
const genreGroups = document.querySelectorAll(".genre-group");

function updateGenres() {
    const selectedType = typeSelect.value;

    genreGroups.forEach(group => {
        const types = group.dataset.type.split(" ");

        if (types.includes(selectedType)) {
            //inportant !! //grid anders werkt niet
            group.style.display = "grid";
        } else {
            group.style.display = "none";

            // Uncheck hidden checkboxes
            group.querySelectorAll("input[type='checkbox']").forEach(cb => {
                cb.checked = false;
            });
        }
    });
}

typeSelect.addEventListener("change", updateGenres);

// Run on page load
updateGenres();


// Item verwijderen
async function verwijderItem(id) {
    if (confirm("Weet je zeker dat je dit wilt verwijderen?")) {
        await fetch(`/items/${id}`, { method: "DELETE" });
        laadItems();
    }
}

// Item bewerken: vul het formulier
async function bewerkItem(id) {
    const res = await fetch("/items");
    const data = await res.json();
    const item = data.find(i => i.id === id);

    document.getElementById("itemForm").style.display = "block";
    document.getElementById("itemId").value = item.id;
    document.getElementById("titel").value = item.titel;
    document.getElementById("type").value = item.type;
    document.getElementById("afbeelding").value = ""; // leeg want we gebruiken file upload
    if (document.getElementById("bron")) document.getElementById("bron").value = item.bron || "";
    document.getElementById("beschrijving").value = item.beschrijving;
    document.getElementById("rating").value = item.rating;
    if (document.getElementById("status")) document.getElementById("status").value = item.status || "";
    if (document.getElementById("datum")) document.getElementById("datum").value = item.datum || "";

    const genresArray = item.genres ? item.genres.split(", ").map(g => g.trim()) : [];
    document.querySelectorAll('#genres input[type="checkbox"]').forEach(cb => cb.checked = genresArray.includes(cb.value));

    document.getElementById("submitBtn").textContent = "Bijwerken";
}

// Formulier submit: toevoegen of bijwerken
document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Upload bestand als er een gekozen is
    let afbeeldingUrl = "";
    const bestand = document.getElementById("afbeelding").files[0];

    if (bestand) {
        const formData = new FormData();
        formData.append("afbeelding", bestand);

        const uploadRes = await fetch("/upload", {
            method: "POST",
            body: formData
        });
        const uploadData = await uploadRes.json();
        afbeeldingUrl = uploadData.url; // URL naar geüploade bestand
    }

    // Genres verzamelen
    const genres = Array.from(document.querySelectorAll('#genres input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .join(", ");

    const nieuwItem = {
        titel: document.getElementById("titel").value.trim(),
        type: document.getElementById("type").value,
        genres,
        beschrijving: document.getElementById("beschrijving").value.trim(),
        afbeelding: afbeeldingUrl || "https://via.placeholder.com/250",
        rating: document.getElementById("rating").value ? parseInt(document.getElementById("rating").value) : null,
        bron: document.getElementById("bron") ? document.getElementById("bron").value.trim() : "",
        status: document.getElementById("status") ? document.getElementById("status").value : null,
        datum: document.getElementById("datum") ? document.getElementById("datum").value : null
    };

    const itemId = document.getElementById("itemId").value;

    if (itemId) {
        // UPDATE item
        await fetch(`/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nieuwItem)
        });
        document.getElementById("submitBtn").textContent = "Opslaan";
    } else {
        // POST nieuw item
        await fetch("/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nieuwItem)
        });
        // Redirect naar overzicht na toevoegen
        window.location.href = "overzicht.html";
        return;
    }

    // Reset form en herlaad lijst
    e.target.reset();
    document.getElementById("itemId").value = "";
    laadItems();
});
function removeDuplicateGenres() {
    document.querySelectorAll(".genre-group").forEach(group => {
        const seen = new Set();

        group.querySelectorAll('#genres input[type="checkbox"]').forEach(checkbox => {
            const value = checkbox.value.trim().toLowerCase();

            if (seen.has(value)) {
                checkbox.parentElement.remove();
            } else {
                seen.add(value);
            }
        });
    });
}

// Run after DOM loads
document.addEventListener("DOMContentLoaded", removeDuplicateGenres);


// Laad items bij het openen van de pagina
laadItems();
console.log("Shounen: Jongens, actie, avontuur, vriendschap, rivaliteit.");
console.log("Shoujo: Meisjes, romantiek, relaties, emotie, persoonlijke groei.");
console.log("Seinen: Volwassen mannen, complexere thema's, vaak realistischer en donkerder.");
console.log("Josei: Volwassen vrouwen, emotioneel drama, realistische relaties.");
console.log("Isekai: Verhalen over mensen die in een andere wereld terechtkomen, vaak met fantasy-elementen.");
console.log("mecha: Verhalen over robots of mechanische suits, vaak met actie en avontuur.");
