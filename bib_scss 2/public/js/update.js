// Controleer of er een ID in de URL staat
const urlParams = new URLSearchParams(window.location.search);
const itemIdFromUrl = urlParams.get("id");

let alleItems = [];

function filterGenresByType(type) {
    const selectedType = (type || "").toLowerCase();
    const groepen = document.querySelectorAll(".genre-group");

    groepen.forEach(group => {
        const types = (group.dataset.type || "").toLowerCase().split(/\s+/);
        const match = !selectedType || types.includes(selectedType);

        group.style.display = match ? "grid" : "none";

        if (!match) {
            group.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
        }
    });
}

// Laad alle items en toon ze
async function laadAlleItems() {
    const res = await fetch("/items");
    alleItems = await res.json();
}

// Toon zoekresultaten while typing
document.getElementById("zoekId").addEventListener("input", async (e) => {
    const zoekTerm = e.target.value.toLowerCase().trim();
    const resultatenDiv = document.getElementById("zoekResultaten");
    
    if (!alleItems.length) await laadAlleItems();
    
    if (zoekTerm === "") {
        resultatenDiv.innerHTML = "";
        return;
    }
    
    const gefilterd = alleItems.filter(item => 
        item.titel.toLowerCase().includes(zoekTerm)
    );
    
    if (gefilterd.length === 0) {
        resultatenDiv.innerHTML = '<div class="resultaat-item">Geen resultaten gevonden</div>';
        return;
    }
    
    resultatenDiv.innerHTML = gefilterd.map(item => 
        `<div class="resultaat-item" data-id="${item.id}">${item.titel}</div>`
    ).join("");
    
    // Voeg click event toe aan resultaten
    document.querySelectorAll(".resultaat-item").forEach(el => {
        el.addEventListener("click", () => {
            document.getElementById("zoekId").value = el.textContent;
            document.getElementById("zoekId").dataset.selectedId = el.dataset.id;
            resultatenDiv.innerHTML = "";
        });
    });
});

// Laad automatisch item als ID in URL staat
if (itemIdFromUrl) {
    laadItemViaId(itemIdFromUrl);
} else {
    laadAlleItems();
}

async function laadItemViaId(id) {
    const res = await fetch("/items");
    const data = await res.json();
    const item = data.find(i => i.id == id);

    if (!item) {
        alert("Item niet gevonden!");
        return;
    }

    vulItemForm(item);
}

function vulItemForm(item) {
    // Toon formulier en vul met data
    document.getElementById("zoekForm").style.display = "none";
    document.getElementById("itemForm").style.display = "block";
    document.getElementById("itemId").value = item.id;
    document.getElementById("huidigeAfbeelding").value = item.afbeelding;
    document.getElementById("titel").value = item.titel;
    document.getElementById("type").value = item.type;
    document.getElementById("bron").value = item.bron || "";
    document.getElementById("beschrijving").value = item.beschrijving;
    document.getElementById("rating").value = item.rating;
    document.getElementById("status").value = item.status || "";
    document.getElementById("datum").value = item.datum || "";

    filterGenresByType(item.type);

    const genresArray = item.genres ? item.genres.split(", ").map(g => g.trim()) : [];
    document.querySelectorAll('#genres input[type="checkbox"]').forEach(cb => cb.checked = genresArray.includes(cb.value));
}

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

// Zoek item
document.getElementById("zoekForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!alleItems.length) await laadAlleItems();
    
    const selectedId = document.getElementById("zoekId").dataset.selectedId;
    const zoekInput = document.getElementById("zoekId").value.trim();
    
    if (!selectedId && !zoekInput) {
        alert("Selecteer of zoek een item!");
        return;
    }
    
    // Zoek op geselecteerde ID of op titel
    let item = null;
    if (selectedId) {
        item = alleItems.find(i => i.id == selectedId);
    } else {
        item = alleItems.find(i => i.titel.toLowerCase() === zoekInput.toLowerCase());
    }
    
    if (!item) {
        alert("Item niet gevonden!");
        return;
    }

    vulItemForm(item);
});

// Bijwerken van item
document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Upload nieuwe afbeelding als er een is gekozen
    let afbeeldingUrl = document.getElementById("huidigeAfbeelding").value;
    const bestand = document.getElementById("afbeelding").files[0];

    if (bestand) {
        const formData = new FormData();
        formData.append("afbeelding", bestand);

        const uploadRes = await fetch("/upload", {
            method: "POST",
            body: formData
        });
        const uploadData = await uploadRes.json();
        afbeeldingUrl = uploadData.url;
    }

    const genres = Array.from(document.querySelectorAll('#genres input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .join(", ");

    const itemId = document.getElementById("itemId").value;

    const nieuwItem = {
        titel: document.getElementById("titel").value.trim(),
        type: document.getElementById("type").value,
        genres,
        beschrijving: document.getElementById("beschrijving").value.trim(),
        afbeelding: afbeeldingUrl,
        bron: document.getElementById("bron").value.trim(),
        rating: document.getElementById("rating").value ? parseInt(document.getElementById("rating").value) : null,
        status: document.getElementById("status").value,
        datum: document.getElementById("datum").value
    };

    await fetch(`/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nieuwItem)
    });

    alert("Item succesvol bijgewerkt!");
    e.target.reset();
    document.getElementById("itemForm").style.display = "none";
    document.getElementById("zoekForm").style.display = "block";
    document.getElementById("zoekId").dataset.selectedId = "";
});

document.addEventListener("DOMContentLoaded", () => {
    removeDuplicateGenres();
    const typeSelect = document.getElementById("type");
    if (typeSelect) {
        filterGenresByType(typeSelect.value);
        typeSelect.addEventListener("change", (e) => filterGenresByType(e.target.value));
    }
});

console.log("Shounen: Jongens, actie, avontuur, vriendschap, rivaliteit.");
console.log("Shoujo: Meisjes, romantiek, relaties, emotie, persoonlijke groei.");
console.log("Seinen: Volwassen mannen, complexere thema's, vaak realistischer en donkerder.");
console.log("Josei: Volwassen vrouwen, emotioneel drama, realistische relaties.");
console.log("Isekai: Verhalen over mensen die in een andere wereld terechtkomen, vaak met fantasy-elementen.");
console.log("mecha: Verhalen over robots of mechanische suits, vaak met actie en avontuur.");

