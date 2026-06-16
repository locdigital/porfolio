from PIL import Image
img = Image.open('logo-playah.png').convert("RGBA")
for y in range(img.height):
    for x in range(img.width):
        r, g, b, a = img.getpixel((x, y))
        if a < 255:
            print(f"Transparent pixel found at {x}, {y} with alpha {a}")
            exit(0)
print("No transparent pixels found.")
