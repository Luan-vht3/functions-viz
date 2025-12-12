// ─────────────────────────────────────────────────────
// Fast sieve generating the first maxL primes
// ─────────────────────────────────────────────────────
function generateFirstPrimes(maxL) {
    // heuristic upper bound: nth prime < n (log n + log log n)
    const n = maxL;
    const est = Math.ceil(n * (Math.log(n) + Math.log(Math.log(n)))) + 10;

    const limit = Math.max(100, est);
    const isPrime = new Uint8Array(limit + 1).fill(1);
    isPrime[0] = isPrime[1] = 0;

    for (let i = 2; i * i <= limit; i++) {
        if (isPrime[i]) {
            for (let j = i * i; j <= limit; j += i) {
                isPrime[j] = 0;
            }
        }
    }

    const primes = [];
    for (let i = 2; i <= limit && primes.length < maxL; i++) {
        if (isPrime[i]) primes.push(i);
    }

    return primes;
}

// gcd helper
function gcd(a, b) {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
}

// all totatives of m
function totatives(m) {
    const r = [];
    for (let a = 1; a < m; a++) if (gcd(a, m) === 1) r.push(a);
    return r;
}

// ─────────────────────────────────────────────────────
// Compute proportions for L = 1..maxL (prime-index-based)
// ─────────────────────────────────────────────────────
function computeProportions(maxL, m) {
    const primes = generateFirstPrimes(maxL);
    const tots = totatives(m);

    const counts = {};
    const proportions = {};
    tots.forEach(t => {
        counts[t] = 0;
        proportions[t] = new Array(maxL).fill(0);
    });

    let total = 0;

    for (let L = 1; L <= maxL; L++) {
        const p = primes[L - 1];

        if (p % m in counts && gcd(p, m) === 1) {
            const r = p % m;
            counts[r]++;
            total++;
        }

        for (const t of tots) {
            proportions[t][L - 1] = total > 0 ? counts[t] / total : 0;
        }
    }

    return { tots, proportions };
}

function totativeColor(t, m) {
    // angle = 2π * t / m
    const hue = (360 * (m-t+1)/m) % 360;  // 0..360 degrees
    const saturation = 70; // %
    const lightness = 50;  // %
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ─────────────────────────────────────────────────────
// Plotting
// ─────────────────────────────────────────────────────
function runPlot(m) {
    const maxL = 100_000;
    const { tots, proportions } = computeProportions(maxL, m);
    const phi = tots.length;

    const traces = tots.map(t => ({
        x: [...Array(maxL).keys()].map(i => i+1),
        y: proportions[t],
        mode: 'lines',
        name: `${t} mod ${m}`,
        line: { width: 0.7, color: totativeColor(t, m) },
        hovertemplate: `${t} mod ${m}<extra></extra>`,
    }));

    const y0 = 1/phi;

    const layout = {
        title: `Proportions of Prime Residue Classes mod ${m}  |  φ(${m})=${phi}`,
        paper_bgcolor: "#111",
        plot_bgcolor: "#111",
        font: { color: "#ddd" },
        xaxis: { title: "L (prime index)", gridcolor: "#333", range: [0, maxL], fixedrange: true },
        yaxis: { title: "Proportion", range: [0, 1], gridcolor: "#333" },
        //legend: { x: 0.98, y: 0.98, xanchor: "right", yanchor: "top", bgcolor: 'rgba(30, 30, 30, 0.5)' },
        shapes: [{ type: 'line', x0: 0, x1: maxL, y0: y0, y1: y0, line: {color: 'white', width: 1, dash: 'dash'} }],
        hovermode: 'closest',
        dragmode: 'pan'
    };

    const config = {
        scrollZoom: true,
        displaylogo: false,
        displayModeBar: true,
    };

    Plotly.newPlot("plot", traces, layout, config);
}


// Button click
document.getElementById("run").addEventListener("click", () => {
    const m = parseInt(document.getElementById("modulus").value);
    runPlot(m);
});

// Press Enter in the input box
document.getElementById("modulus").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const m = parseInt(document.getElementById("modulus").value);
        runPlot(m);
    }
});

// Auto-run on page load
window.addEventListener("DOMContentLoaded", () => {
    runPlot(12); // default plot
});
