// ============================================================
// Interactive Divisor Plot (loads precomputed CSV with factorization)
// CSV format expected: n,sigma_minus_n,"factorization"
// Example: 60,108,"2^2 × 3 × 5"
// ============================================================

// --- robust CSV line parser (handles quoted fields) ---
function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // handle escaped double quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  fields.push(cur);
  return fields;
}

// --- Load CSV data (expects optional header) ---
async function loadSigmaData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const text = await response.text();
  const rawLines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

  // If first line contains a non-numeric start (header), skip it
  let startIdx = 0;
  if (rawLines.length > 0) {
    const first = rawLines[0].split(',')[0].trim();
    if (!/^\d+$/.test(first)) startIdx = 1;
  }

  const x = [];
  const y = [];
  const factor = [];

  for (let i = startIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    // parse robustly
    const fields = parseCSVLine(line);

    // tolerate either 2 or 3 fields; if factor field missing, put empty string
    if (fields.length < 2) continue;
    const n = Number(fields[0].trim());
    const s = Number(fields[1].trim());
    const fac = (fields.length >= 3) ? fields[2].trim() : '';

    if (!Number.isFinite(n) || !Number.isFinite(s)) continue;

    x.push(n);
    y.push(s);
    factor.push(fac);
  }

  return { x, y, factor };
}

// --- Build Interactive Plot from loaded CSV ---
async function makePlotFromFile(url) {
  const { x, y, factor } = await loadSigmaData(url);

  const def = { x: [], y: [], text: [] };
  const per = { x: [], y: [], text: [] };
  const abu = { x: [], y: [], text: [] };

  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = y[i];
    const fac = factor[i] || '1'; // fallback for n=1 or missing fact

    // Prepare the exact hover text the user requested.
    // Use <br> to break lines in Plotly hover.
    const hoverText = `n = ${xi} = ${fac}<br>σ(n) − n = ${yi}`;

    if (yi < xi) {
      def.x.push(xi); def.y.push(yi); def.text.push(hoverText);
    } else if (yi === xi) {
      per.x.push(xi); per.y.push(yi); per.text.push(hoverText);
    } else {
      abu.x.push(xi); abu.y.push(yi); abu.text.push(hoverText);
    }
  }

  const maxX = x.length ? Math.max(...x) : 1;

  const data = [
    {
      x: def.x, y: def.y, text: def.text,
      mode: 'markers', type: 'scattergl',
      name: 'Deficient',
      marker: { color: '#f52f2f', size: 2, opacity: 0.6 },
      hovertemplate: '%{text}<extra></extra>'
    },
    {
      x: abu.x, y: abu.y, text: abu.text,
      mode: 'markers', type: 'scattergl',
      name: 'Abundant',
      marker: { color: '#2ff55a', size: 2, opacity: 0.6 },
      hovertemplate: '%{text}<extra></extra>'
    },
    {
      x: per.x, y: per.y, text: per.text,
      mode: 'markers', type: 'scattergl',
      name: 'Perfect',
      marker: {
        color: 'gold', size: 8, symbol: 'star',
        line: { color: 'black', width: 1 }
      },
      hovertemplate: '%{text}<extra></extra>'
    },
  ];

  const layout = {
    title: `Sum of Proper Divisors`,
    paper_bgcolor: '#111',
    plot_bgcolor: '#111',
    font: { color: '#ddd' },
    xaxis: { title: 'n', type: 'log', gridcolor: '#333' },
    yaxis: { title: 'σ(n) − n', type: 'log', gridcolor: '#333' },
    legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(0,0,0,0)' },
    hovermode: 'closest'
  };

  const config = {
    scrollZoom: true,
    displaylogo: false,
    displayModeBar: true
  };

  Plotly.newPlot('plot', data, layout, config).then(gd => {
    Plotly.relayout(gd, { dragmode: 'pan' });
  });
}

// --- Run (change filename if needed) ---
makePlotFromFile('sigma.csv').catch(err => {
  console.error('Error loading/plotting CSV:', err);
  const el = document.getElementById('plot');
  if (el) el.innerText = 'Error loading CSV: see console for details.';
});
