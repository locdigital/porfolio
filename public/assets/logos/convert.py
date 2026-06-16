import os
from PIL import Image

files = [
    ("logo-playah.png", "logo-playah.webp"),
    ("logo-pnj.png", "logo-pnj.webp"),
    ("logo-pops.jpg", "logo-pops.webp"),
    ("logo-sony.jpg", "logo-sony.webp"),
    ("logo-workflow.png", "logo-workflow.webp")
]

for src, dst in files:
    img = Image.open(src)
    img.save(dst, "WEBP", quality=80)
