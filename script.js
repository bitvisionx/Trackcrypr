// Data per platform
let wallets = {
  blox: [],
  bitvavo: []
};

// Bij laden pagina data inladen uit localStorage
window.onload = () => {
  const saved = localStorage.getItem("cryptoWallets");
  if (saved) {
    wallets = JSON.parse(saved);
  }
  render();
};

// Data opslaan
function saveData() {
  localStorage.setItem("cryptoWallets", JSON.stringify(wallets));
}

// Haal complete lijst van munten op van CoinGecko
async function fetchCoinList() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list");
  if (!res.ok) throw new Error("Fout bij ophalen muntenlijst");
  return await res.json();
}

// Vind coin id op basis van symbol (zoals btc, xrp)
function getCoinIdBySymbol(symbol, coinList) {
  // Zoek eerst exact match symbol
  const exactMatch = coinList.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
  if (exactMatch) return exactMatch.id;
  return null;
}

// Haal actuele prijs in euro op via CoinGecko
async function fetchPrice(id) {
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
  if (!res.ok) throw new Error("Fout bij ophalen prijs");
  const data = await res.json();
  return data[id]?.eur || 0;
}

// Voeg nieuwe aankoop toe
async function addCoin(platform) {
  const coinList = await fetchCoinList();

  let symbol = prompt("Welke munt wil je toevoegen (bijv. BTC, XRP)?");
  if (!symbol) return alert("Geen munt ingevoerd.");
  symbol = symbol.trim().toLowerCase();

  const id = getCoinIdBySymbol(symbol, coinList);
  if (!id) return alert("Munt niet gevonden.");

  let amountInput = prompt("Hoeveel munt heb je gekocht (bijv. 0.5)?");
  if (!amountInput) return alert("Geen hoeveelheid ingevoerd.");
  amountInput = amountInput.replace(",", ".").trim();
  const amount = parseFloat(amountInput);
  if (isNaN(amount) || amount <= 0) return alert("Ongeldige hoeveelheid.");

  let totalInput = prompt("Wat is het totale bedrag in euro dat je hebt betaald voor deze aankoop?");
  if (!totalInput) return alert("Geen aankoopbedrag ingevoerd.");
  totalInput = totalInput.replace(",", ".").trim();
  const totalInvested = parseFloat(totalInput);
  if (isNaN(totalInvested) || totalInvested <= 0) return alert("Ongeldig aankoopbedrag.");

  const currentPrice = await fetchPrice(id);
  if (currentPrice === 0) return alert("Kan huidige prijs niet ophalen.");

  const coinName = coinList.find(c => c.id === id)?.name || symbol.toUpperCase();

  wallets[platform].push({
    symbol,
    name: coinName,
    amount,
    totalInvested,
    buyPrice: totalInvested / amount,
    currentPrice
  });

  saveData();
  render();
}

// Verwijder aankoop
function removeCoin(platform, index) {
  if (!wallets[platform]) return;
  wallets[platform].splice(index, 1);
  saveData();
  render();
}

// Render data naar HTML
function render() {
  ["blox", "bitvavo"].forEach(platform => {
    const container = document.getElementById(`${platform}-coins`);
    const totalContainer = document.getElementById(`${platform}-total`);
    if (!container || !totalContainer) return;

    container.innerHTML = "";
    let totalInvested = 0;
    let totalCurrent = 0;

    wallets[platform].forEach((entry, index) => {
      const currentValue = entry.amount * entry.currentPrice;
      const profit = currentValue - entry.totalInvested;

      totalInvested += entry.totalInvested;
      totalCurrent += currentValue;

      const div = document.createElement("div");
      div.className = "coin";
      div.innerHTML = `
        <strong>${entry.name}</strong><br/>
        Hoeveelheid: ${entry.amount} ${entry.symbol.toUpperCase()}<br/>
        Totale aankoopprijs: €${entry.totalInvested.toFixed(2)}<br/>
        Aankoopprijs per stuk: €${entry.buyPrice.toFixed(2)}<br/>
        Huidige waarde: €${currentValue.toFixed(2)}<br/>
        Winst/verlies: <strong style="color:${profit >= 0 ? 'lime' : 'red'}">€${profit.toFixed(2)}</strong><br/>
        <button onclick="removeCoin('${platform}', ${index})">Verwijderen</button>
      `;
      container.appendChild(div);
    });

    const totalProfit = totalCurrent - totalInvested;

    totalContainer.innerHTML = `
      Totale investering: €${totalInvested.toFixed(2)}<br/>
      Totale waarde nu: €${totalCurrent.toFixed(2)}<br/>
      Totaal winst/verlies: <strong style="color:${totalProfit >= 0 ? 'lime' : 'red'}">€${totalProfit.toFixed(2)}</strong>
    `;
  });
}
