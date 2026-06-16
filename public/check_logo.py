import sys
from PIL import Image

for img_path in sys.argv[1:]:
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    
    # Check pixels at corners and center
    pixels = [
        ("top-left", img.getpixel((0, 0))),
        ("center", img.getpixel((width//2, height//2))),
        ("top-middle", img.getpixel((width//2, 0)))
    ]
    print(f"Image: {img_path} ({width}x{height})")
    for name, p in pixels:
        print(f"  {name}: {p}")
