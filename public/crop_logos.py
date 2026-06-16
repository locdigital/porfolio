import os
import sys
from PIL import Image

def crop_logo(path):
    img = Image.open(path).convert("RGB")
    
    # Get the background color from top-left pixel
    bg_color = img.getpixel((0, 0))
    
    # Create a mask where pixels are different from bg_color (with tolerance)
    width, height = img.size
    min_x, min_y, max_x, max_y = width, height, 0, 0
    
    tolerance = 15 # Allow some color variation for compression artifacts
    
    for y in range(height):
        for x in range(width):
            p = img.getpixel((x, y))
            if abs(p[0] - bg_color[0]) > tolerance or \
               abs(p[1] - bg_color[1]) > tolerance or \
               abs(p[2] - bg_color[2]) > tolerance:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    if min_x <= max_x and min_y <= max_y:
        # Add some padding
        pad = 20
        left = max(0, min_x - pad)
        top = max(0, min_y - pad)
        right = min(img.width, max_x + pad)
        bottom = min(img.height, max_y + pad)
        
        cropped = img.crop((left, top, right, bottom))
        cropped.save(path)
        print(f"Cropped {path} from {img.width}x{img.height} to {cropped.width}x{cropped.height}")
    else:
        print(f"Could not find bounding box for {path}")

for f in os.listdir("assets/logos"):
    if f.endswith(".webp"):
        crop_logo(os.path.join("assets/logos", f))
