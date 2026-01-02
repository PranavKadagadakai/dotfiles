import matplotlib.pyplot as plt

# Catppuccin Mocha accent colors (from official palette)
accents = {
    "Rosewater": "#f5e0dc",
    "Flamingo":  "#f2cdcd",
    "Pink":      "#f5c2e7",
    "Mauve":     "#cba6f7",
    "Red":       "#f38ba8",
    "Maroon":    "#eba0ac",
    "Peach":     "#fab387",
    "Yellow":    "#f9e2af",
    "Green":     "#a6e3a1",
    "Teal":      "#94e2d5",
    "Sky":       "#89dceb",
    "Sapphire":  "#74c7ec",
    "Blue":      "#89b4fa",  # <- Default
    "Lavender":  "#b4befe"
}

# Draw grid
fig, ax = plt.subplots(figsize=(10, 6))
ax.set_xlim(0, 7)
ax.set_ylim(0, 2)
ax.axis("off")

for i, (name, hexval) in enumerate(accents.items()):
    row = i // 7
    col = i % 7
    rect = plt.Rectangle((col, 1-row), 1, 1, facecolor=hexval)
    ax.add_patch(rect)
    ax.text(col+0.5, 1-row-0.5, name, ha="center", va="center",
            fontsize=9, color="black" if row==0 else "white",
            weight="bold")

plt.tight_layout()
plt.savefig("catppuccin_mocha_grid.png", dpi=150)
print("Saved preview as catppuccin_mocha_grid.png")