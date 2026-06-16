import os
from PIL import Image, ImageChops

dir_path = 'public/assets/logos/'
# Find all unique base names
files = os.listdir(dir_path)
bases = set([f.split('.')[0] for f in files if f.startswith('logo-') and f.endswith(('.png', '.jpg', '.webp'))])

for base in bases:
    # Prefer png > webp > jpg
    for ext in ['.png', '.webp', '.jpg']:
        path = os.path.join(dir_path, f"{base}{ext}")
        if os.path.exists(path):
            break
    else:
        continue
        
    print(f"Processing {path}...")
    try:
        with Image.open(path) as img:
            img = img.convert("RGBA")
            
            bg_color = img.getpixel((0,0))
            if bg_color[3] < 10:
                bg_color = (0, 0, 0, 255)
                
            new_img = Image.new('RGBA', (2000, 1000), bg_color)
            
            # Find bounding box
            bg = Image.new('RGBA', img.size, bg_color)
            diff = ImageChops.difference(img, bg)
            bbox = diff.getbbox()
            
            if bbox:
                cropped = img.crop(bbox)
            else:
                cropped = img
                
            # target width 45% = 900px, target height max 500px
            target_w = 900
            target_h = 500
            
            aspect = cropped.width / cropped.height
            if target_w / aspect <= target_h:
                new_w = target_w
                new_h = int(target_w / aspect)
            else:
                new_h = target_h
                new_w = int(target_h * aspect)
                
            resized_logo = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            paste_x = (2000 - new_w) // 2
            paste_y = (1000 - new_h) // 2
            
            new_img.paste(resized_logo, (paste_x, paste_y), resized_logo)
            
            # Save over the webp version
            save_path = os.path.join(dir_path, f"{base}.webp")
            new_img.convert('RGB').save(save_path, 'WEBP', quality=95)
            print(f"Saved {save_path}")
    except Exception as e:
        print(f"Error on {base}: {e}")

