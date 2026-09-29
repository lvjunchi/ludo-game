"""Generate the app's geometric dice icon, without external assets."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'icons'
root.mkdir(exist_ok=True)
for size in (192, 512):
    image = Image.new('RGB', (size, size), '#fce4ec')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((size * .15, size * .15, size * .85, size * .85), radius=size * .12, fill='#c2185b')
    for x, y in ((.32, .32), (.68, .32), (.5, .5), (.32, .68), (.68, .68)):
        r = size * .052
        draw.ellipse((size*x-r, size*y-r, size*x+r, size*y+r), fill='white')
    image.save(root / f'icon-{size}.png')
