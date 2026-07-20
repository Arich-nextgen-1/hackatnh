import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow is not installed. Attempting to install it...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw

def create_icon(size, filename, is_maskable=False):
    # Create image with transparent background
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Background: Rounded circle for standard icon, full square for maskable
    if is_maskable:
        # PWA maskable icons need a safe area. Fill the entire canvas.
        draw.rectangle([0, 0, size, size], fill=(37, 99, 235, 255))
        # Draw a white medical cross in the safe zone (middle 60%)
        margin = int(size * 0.28)
        bar_width = int(size * 0.16)
    else:
        # Round circle background
        draw.ellipse([0, 0, size, size], fill=(37, 99, 235, 255))
        margin = int(size * 0.22)
        bar_width = int(size * 0.18)
        
    # Draw cross (horizontal & vertical bars)
    center = size // 2
    half_bar = bar_width // 2
    
    # Vertical bar
    draw.rectangle([center - half_bar, margin, center + half_bar, size - margin], fill=(255, 255, 255, 255))
    # Horizontal bar
    draw.rectangle([margin, center - half_bar, size - margin, center + half_bar], fill=(255, 255, 255, 255))
    
    # Save
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, "PNG")
    print(f"Created {filename}")

# Sizes to generate
create_icon(192, "public/icons/icon-192.png")
create_icon(512, "public/icons/icon-512.png")
create_icon(192, "public/icons/icon-192-maskable.png", is_maskable=True)
create_icon(512, "public/icons/icon-512-maskable.png", is_maskable=True)
create_icon(180, "public/icons/apple-touch-icon.png")

# Also generate a favicon.ico using a small 32x32 size
img_32 = Image.new("RGBA", (32, 32), (255, 255, 255, 0))
draw_32 = ImageDraw.Draw(img_32)
draw_32.ellipse([0, 0, 32, 32], fill=(37, 99, 235, 255))
# Cross for 32x32
draw_32.rectangle([14, 7, 18, 25], fill=(255, 255, 255, 255))
draw_32.rectangle([7, 14, 25, 18], fill=(255, 255, 255, 255))
img_32.save("public/favicon.ico", "ICO")
print("Created public/favicon.ico")
