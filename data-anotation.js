import * as cheerio from "cheerio";

async function decodeSecretMessage(url) {
  const res = await fetch(url);

  if (!res.ok) {
throw new Error(`Failed to fetch: ${res.status}`);
}

  const html = await res.text();

  const $tc = cheerio.load(html);
  const table = $tc("table").first();

  if (!table.length) {
    console.log("No table found");

    return;
  }

  const points = [];
  let maxX = 0;
  let maxY = 0;

  table.find("tr").slice(1).each((_, row) => {
    const cells = $tc(row).find("td");

    if (cells.length !== 3) {
return;
}

    const x = parseInt($tc(cells[0]).text().trim(), 10);
    const char = $tc(cells[1]).text().trim();
    const y = parseInt($tc(cells[2]).text().trim(), 10);

    if (isNaN(x) || isNaN(y)) {
return;
}

    points.push({ x, y, char });

    if (x > maxX) {
maxX = x;
}

    if (y > maxY) {
maxY = y;
}
  });

  if (points.length === 0) {
    console.log("No data found");

    return;
  }

  const grid = Array.from({ length: maxY + 1 }, () =>
    Array(maxX + 1).fill(" ")
  );

  for (const { x, y, char } of points) {
    grid[y][x] = char;
  }

  for (let y = maxY; y >= 0; y--) {
    console.log(grid[y].join(""));
  }
}

const url = "https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub";
decodeSecretMessage(url).catch(console.error);