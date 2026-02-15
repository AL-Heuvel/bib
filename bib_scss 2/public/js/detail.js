// Item ID uit URL ophalen
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

if (!itemId) {
  alert("Geen item ID gevonden!");
  window.location.href = "overzicht.html";
}

// Item laden en weergeven
async function laadItem() {
  const res = await fetch(`/items`);
  const data = await res.json();
  const item = data.find(i => i.id == itemId);

  if (!item) {
    alert("Item niet gevonden!");
    window.location.href = "overzicht.html";
    return;
  }

  // Detail weergave vullen
  document.getElementById("detailImage").src = item.afbeelding || "https://via.placeholder.com/250";
  document.getElementById("detailTitel").textContent = item.titel;
  document.getElementById("detailType").textContent = item.type;
  document.getElementById("detailGenres").textContent = item.genres || "Geen genres";
  document.getElementById("detailBeschrijving").textContent = item.beschrijving;
  document.getElementById("detailRating").textContent = item.rating ? `${item.rating}/10` : "N/A";
  document.getElementById("detailBron").innerHTML = item.bron ? `<a href="${item.bron}" target="_blank" rel="noopener">Link</a>` : "N/A";
  document.getElementById("detailStatus").textContent = item.status ? item.status.replace(/_/g, ' ') : "N/A";
  document.getElementById("detailDatum").textContent = item.datum || "N/A";

  // Set edit button link
  document.getElementById("btnEdit").href = `update.html?id=${item.id}`;
}

// Item verwijderen
async function verwijderItem() {
  if (confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
    await fetch(`/items/${itemId}`, { method: "DELETE" });
    window.location.href = "overzicht.html";
  }
}

// Item laden bij pagina load
laadItem();