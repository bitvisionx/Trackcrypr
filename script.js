const API_BASE = "https://api.coingecko.com/api/v3";
let coinsData = {};
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
  const allCoins = await res.json();
  return allCoins;
}

async function fetchPrice(id) {
  const res = await fetch(`${API_BASE}/simple/price?ids=${id}&vs_currencies=eur`);
  const json = await res.json();
  return json[id]?.eur || 0;
}

function getCoinIdBySymbol(symbol, coinList) {
  const coin = coinList.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
  return coin ? coin.id : null;
}

function render() {
  ["blox", "bitvavo"].forEach(platform => {
    const container = document.getElementById(`${platform}-coins`);
    container.innerHTML = "";
    let totalInvested = 0;
    let totalNow = 0;

    wallets[platform].forEach((entry, index) => {
      const valueNow = entry.currentPrice * entry.amount;
      const profit = valueNow - entry.totalValue;
      totalInvested += entry.totalValue;
      totalNow += valueNow;

      const div = document.createElement("div");
      div.className = "coin";
      div.innerHTML = `
        <strong>${entry.name}</strong><br/>
        Aantal: ${entry.amount} ${entry.symbol.toUpperCase()}<br/>
        Prijs per stuk bij aankoop: €${entry.buyPrice.toFixed(2)}<br/>
        Totale aankoopwaarde: €${entry.totalValue.toFixed(2)}<br/>
        Huidige waarde: €${valueNow.toFixed(2)}<br/>
        Winst/verlies: <strong style="color:${profit >= 0 ? 'lime' : 'red'}">€${profit.toFixed(2)}</strong>
        <br/><button onclick="removeCoin('${platform}', ${index})">Verwijderen</button>
      `;
      container.appendChild(div);
    });

    document.getElementById(`${platform}-total`).innerHTML = `
      Totale aankoopwaarde: €${totalInvested.toFixed(2)}<br/>
      Totale huidige waarde: €${totalNow.toFixed(2)}<br/>
      Totaal winst/verlies: <strong style="color:${(totalNow - totalInvested) >= 0 ? 'lime' : 'red'}">€${(totalNow - totalInvested).toFixed(2)}</strong>
    `;
  });
}

async function addCoin(platform) {
  const symbol = prompt("Welke munt (bv: BTC)?").toLowerCase();
  const amount = parseFloat(prompt("Hoeveel heb je gekocht (bv: 0.5)?"));
  const buyPrice = parseFloat(prompt("Wat was de aankoopprijs per stuk in euro?"));

  if (!symbol || isNaN(amount) || isNaN(buyPrice)) return alert("Ongeldige invoer.");

  const coinList = await fetchCoinList();
  const id = getCoinIdBySymbol(symbol, coinList);

  if (!id) return alert("Munt niet gevonden via CoinGecko.");

  const currentPrice = await fetchPrice(id);
  const name = coinList.find(c => c.id === id)?.name || symbol;

  wallets[platform].push({
    symbol,
    name,
    amount,
    buyPrice,
    totalValue: amount * buyPrice,
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
