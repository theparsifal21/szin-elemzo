const szinBetuk = {
    'piros': ['a', 'j', 's', 'á', '1'],
    'narancssárga': ['b', 'k', 't', '2'],
    'sárga': ['c', 'l', 'u', 'ú', 'ü', 'ű', '3'],
    'zöld': ['d', 'm', 'v', '4'],
    'kék': ['e', 'n', 'w', 'é', '5'],
    'lila': ['g', 'p', 'y', '7'],
    'indigo': ['f', 'o', 'x', 'ó', 'ö', 'ő', '6'],
    'rózsapiros': ['h', 'q', 'z', '8'],
    'arany': ['i', 'r', 'í', '9']
};

const szinHex = {
    'piros': '#ff4d4d',
    'narancssárga': '#ff9f43',
    'sárga': '#ffd93d',
    'zöld': '#4cd137',
    'kék': '#3c91ff',
    'indigo': '#5f27cd',
    'lila': '#9b59b6',
    'rózsapiros': '#ff6bcb',
    'arany': '#fbc531'
};

const szinSorrend = [
    'piros',
    'narancssárga',
    'sárga',
    'zöld',
    'kék',
    'indigo',
    'lila',
    'rózsapiros',
    'arany'
];

const betuSzin = {};

for (const [szin, betuk] of Object.entries(szinBetuk)) {
    for (const betu of betuk) {
        betuSzin[betu] = szin;
    }
}

const input = document.getElementById("nameInput");
const button = document.getElementById("analyzeBtn");
const results = document.getElementById("results");

// Listeners
button.addEventListener("click", analyze);
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        analyze();
    }
});

function analyze() {
    const nev = input.value.trim().toLowerCase();

    // Clear previous results unconditionally
    results.innerHTML = "";

    if (!nev) return;

    const szamlalo = {};
    const unknown = [];

    for (const szin of szinSorrend) {
        szamlalo[szin] = 0;
    }

    for (const betu of nev) {
        if (betu === " ") continue;

        if (betuSzin[betu]) {
            szamlalo[betuSzin[betu]]++;
        } else {
            // Avoid duplicating the same unknown character in the warning box
            if (!unknown.includes(betu)) {
                unknown.push(betu);
            }
        }
    }

    const card = document.createElement("div");
    card.className = "result-card";

    // Create a container specifically for rows so CSS :last-child remains accurate
    const rowsContainer = document.createElement("div");
    rowsContainer.className = "rows-container";

    szinSorrend.forEach(szin => {
        const row = document.createElement("div");
        row.className = "result-row";

        row.innerHTML = `
            <div class="left">
                <div 
                    class="color-dot"
                    style="background:${szinHex[szin]}"
                ></div>
                <span>${szin}</span>
            </div>
            <span class="count">${szamlalo[szin]}</span>
        `;
        rowsContainer.appendChild(row);
    });
    
    card.appendChild(rowsContainer);

    if (unknown.length > 0) {
        const warning = document.createElement("div");
        warning.className = "warning";
        warning.innerHTML = `
            Ismeretlen karakterek: 
            <b>${unknown.join(", ")}</b>
        `;
        card.appendChild(warning);
    }

    results.appendChild(card);
}