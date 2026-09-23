import requests
from bs4 import BeautifulSoup

def decode_secret_message(url):
    # Grab the page
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table")
    if not table:
        print("Couldn't find a table in the doc.")
        return

    points = []
    max_x = 0
    max_y = 0

    # Skip the header row and pull out the data
    for row in table.find_all("tr")[1:]:
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cells) != 3:
            continue
        try:
            x = int(cells[0])
            char = cells[1]
            y = int(cells[2])
        except ValueError:
            continue

        points.append((x, y, char))
        if x > max_x:
            max_x = x
        if y > max_y:
            max_y = y

    if not points:
        print("No usable data found.")
        return

    # Make a grid full of spaces
    grid = [[" " for _ in range(max_x + 1)] for _ in range(max_y + 1)]

    # Drop the characters into place
    for x, y, char in points:
        grid[y][x] = char

    # Print from the top down so it looks right
    for y in range(max_y, -1, -1):
        print("".join(grid[y]))