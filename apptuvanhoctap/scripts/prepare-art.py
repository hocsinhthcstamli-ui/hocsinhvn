"""Prepare supplied artwork; originals in anh/ are never modified.
Requires Pillow, numpy and scipy (build-time only).
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'art'
OUT.mkdir(parents=True, exist_ok=True)
# Source prefix, semantic name, export size, remove baked neutral background.
ASSETS = [
    ('aq3kce', 'stage-1', 480, True),
    ('k1x01p', 'stage-2', 480, True),
    ('zflj0a', 'stage-3', 480, True),
    ('rkef95', 'buddy-welcome', 320, True),
    ('pzkfto', 'buddy-growing', 320, True),
    ('yygmar', 'buddy-success', 320, True),
    ('q3rmqt', 'badge-start', 200, True),
    ('sfyo2q', 'badge-connect', 200, True),
    ('7fgzgb', 'badge-independent', 200, True),
    ('wnv5z0', 'garden', 420, True),
    ('bj3892', 'journey-background', 800, False),
    ('nh1k9l', 'lesson-cover', 960, False),
    ('hmogv3', 'buddy-request', 480, False),
]

def cutout(image):
    rgb = np.asarray(image.convert('RGB')).astype(np.int16)
    # Supplied checkerboards are neutral gray; illustrations have colored outlines.
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    mask = chroma > 12
    labels, _ = ndimage.label(mask)
    sizes = np.bincount(labels.ravel())
    keep = sizes > 100
    keep[0] = False
    mask = keep[labels]
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    labels, _ = ndimage.label(mask)
    sizes = np.bincount(labels.ravel())
    keep = sizes > 500
    keep[0] = False
    mask = keep[labels]
    mask = ndimage.binary_dilation(mask, iterations=1)
    alpha = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.55))
    result = image.convert('RGBA')
    result.putalpha(alpha)
    bounds = alpha.getbbox()
    return result.crop(bounds) if bounds else result

manifest = []
sheet = Image.new('RGB', (1000, 190 * ((len(ASSETS) + 4)//5)), '#faf8f2')
draw = ImageDraw.Draw(sheet)
for i, (prefix, name, size, transparent) in enumerate(ASSETS):
    source = next(p for p in (ROOT/'anh').glob(f'Gemini_Generated_Image_{prefix}*.png') if ' (1)' not in p.name)
    image = Image.open(source)
    if transparent:
        image = cutout(image)
        image.thumbnail((size-24, size-24), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA',(size,size))
        canvas.alpha_composite(image,((size-image.width)//2,(size-image.height)//2))
        image = canvas
    else:
        image = image.convert('RGB')
        image.thumbnail((size,size*2),Image.Resampling.LANCZOS)
    destination = OUT / f'{name}.webp'
    image.save(destination,'WEBP',quality=86,method=6)
    manifest.append({'source':str(source.relative_to(ROOT)), 'output':str(destination.relative_to(ROOT)), 'bytes':destination.stat().st_size, 'transparent':transparent})
    thumb=image.copy(); thumb.thumbnail((180,150))
    x=(i%5)*200+(200-thumb.width)//2; y=(i//5)*190
    sheet.paste(thumb,(x,y),thumb if thumb.mode=='RGBA' else None)
    draw.text(((i%5)*200+8,y+158),name,fill='#26352b')
(OUT/'sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
sheet.save(ROOT/'tmp'/'prepared-art.jpg')
print(f'{len(manifest)} assets, {sum(x["bytes"] for x in manifest):,} bytes total')
