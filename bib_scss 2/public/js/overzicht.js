let allItems = [];

async function laadItems() {
  const res = await fetch("/items");
  allItems = await res.json();
  // Sorteer op ID aflopend (nieuwste eerst)
  allItems.sort((a, b) => b.id - a.id);
  
  // Vul de filter dropdowns
  vulTypeFilter();
  vulGenreFilter();
  
  toonItems(allItems);
}

function vulTypeFilter() {
  const types = [...new Set(allItems.map(item => item.type))].sort();
  const typeSelect = document.getElementById("typeFilter");
  
  types.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeSelect.appendChild(option);
  });
}

function vulGenreFilter() {
  const allGenres = new Set();
  allItems.forEach(item => {
    if (item.genres) {
      item.genres.split(", ").forEach(genre => allGenres.add(genre.trim()));
    }
  });
  
  const genres = Array.from(allGenres).sort();
  const genreSelect = document.getElementById("genreFilter");
  
  genres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreSelect.appendChild(option);
  });
}

function toonItems(items) {
  const lijst = document.getElementById("lijst");
  lijst.innerHTML = "";

  if (items.length === 0) {
    lijst.innerHTML = '<p style="text-align: center; color: #ffcc70;">Geen items gevonden</p>';
    return;
  }

  items.forEach(item => {
    lijst.innerHTML += `
      <div class="card" onclick="goToDetail(${item.id})" style="cursor: pointer;">
        <img src="${item.afbeelding || 'https://via.placeholder.com/250'}" alt="">
        <div class="card-content">
          <h3>${item.titel}</h3>
          <p><strong>Type:</strong> ${item.type}</p>
          <p><strong>Genres:</strong> ${item.genres}</p>
          <p>${item.beschrijving}</p>
          <p><strong>Rating:</strong> ${item.rating !== null ? item.rating : "N/A"}/10</p>
          <p><strong>Status:</strong> ${item.status ? item.status.replace(/_/g, ' ') : 'N/A'}</p>
          ${item.datum ? `<p><strong>Date completed:</strong> ${item.datum}</p>` : ''}
          ${item.bron ? `<p><strong>Origineel:</strong> <a href="${item.bron}" target="_blank" rel="noopener">Link</a></p>` : ''}
          <div class="card-actions">
            <a href="update.html?id=${item.id}" class="btn-edit" onclick="event.stopPropagation();">Bewerken</a>
            <button onclick="event.stopPropagation(); verwijderItem(${item.id})">Verwijderen</button>
          </div>
        </div>
      </div>
    `;
  });
}

function goToDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

function filterItems() {
  const typeFilter = document.getElementById("typeFilter").value.toLowerCase();
  const genreFilter = document.getElementById("genreFilter").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value.toLowerCase();
  
  const filtered = allItems.filter(item => {
    const typeMatch = !typeFilter || item.type.toLowerCase() === typeFilter;
    const genreMatch = !genreFilter || (item.genres || "").toLowerCase().includes(genreFilter);
    const statusMatch = !statusFilter || (item.status || "").toLowerCase() === statusFilter;
    
    return typeMatch && genreMatch && statusMatch;
  });
  
  toonItems(filtered);
}

function resetFilters() {
  document.getElementById("typeFilter").value = "";
  document.getElementById("genreFilter").value = "";
  document.getElementById("statusFilter").value = "";
  toonItems(allItems);
}

async function verwijderItem(id) {
  if (confirm("Weet je zeker dat je dit wilt verwijderen?")) {
    await fetch(`/items/${id}`, { method: "DELETE" });
    laadItems();
  }
}

// Event listeners voor filteren
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("typeFilter").addEventListener("change", filterItems);
  document.getElementById("genreFilter").addEventListener("change", filterItems);
  document.getElementById("statusFilter").addEventListener("change", filterItems);
  document.getElementById("resetBtn").addEventListener("click", resetFilters);
  
  laadItems();
});