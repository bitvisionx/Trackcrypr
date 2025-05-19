const API_BASE = "https://api.coingecko.com/api/v3";
let wallets = {
  blox: [],
  bitvavo: []
};

function saveData() {
  localStorage.setItem("cryptoTracker", JSON.stringify(wallets));
}

function loadData() {
  const data = localStorage.getItem("cryptoTracker");
  if (data) wallets = JSON.parse(data);
}

async function fetchCoinList() {
  const res = await fetch(`${API_BASE}/coins/list`);
  return await res.json();
}

async function fetchPrice(id) {
  const res = await fetch(`${API_BASE}/simple/price?ids=${id}&vs_currencies=eur`);
  const json = await res.json();
  return json[id]?.eur || 0;
}

function getCoinIdBySymbol(symbol, coinList) {
  const match = coinList.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
  return match ? match.id : null;
}

function render() {
  ["blox", "bitvavo"].forEach(platform => {
    const container = document.getElementById(`${platform}-coins`);
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
        Winst/verlies: <strong style="color:${profit >= 0 ? 'lime' : 'red'}">€${profit.toFixed(2)}</strong>
        <br/><button onclick="removeCoin('${platform}', ${index})">Verwijderen</button>
      `;
      container.appendChild(div);
    });

    document.getElementById(`${platform}-total`).innerHTML = `
      Totale investering: €${totalInvested.toFixed(2)}<br/>
      Totale waarde nu: €${totalCurrent.toFixed(2)}<br/>
      Totaal winst/verlies: <strong style="color:${(totalCurrent - totalInvested) >= 0 ? 'lime' : 'red'}">
        €${(totalCurrent - totalInvested).toFixed(2)}
      </strong>
    `;
  });
}

async function addCoin(platform) {
  const symbol = prompt("Welke munt wil je toevoegen (bijv. BTC)?").toLowerCase();
  const amount = parseFloat(prompt("Hoeveel munt heb je gekocht (bijv. 0.5)?"));
  const totalInvested = parseFloat(prompt("Wat is het totale bedrag in euro dat je hebt betaald voor deze aankoop?"));

  if (!symbol || isNaN(amount) || isNaN(totalInvested) || amount <= 0 || totalInvested <= 0) {
    return alert("Ongeldige invoer.");
  }

  const coinList = await fetchCoinList();
  const id = getCoinIdBySymbol(symbol, coinList);
  if (!id) return alert("Munt niet gevonden via CoinGecko.");

  const currentPrice = await fetchPrice(id);
  const name = coinList.find(c => c.id === id)?.name || symbol;

  wallets[platform].push({
    symbol,
    name,
    amount,
    totalInvested,
    buyPrice: totalInvested / amount,
    currentPrice
  });

  saveData();
  render();
}

function removeCoin(platform, index) {
  wallets[platform].splice(index, 1);
  saveData();
  render();
}

// Init
loadData();
render();
