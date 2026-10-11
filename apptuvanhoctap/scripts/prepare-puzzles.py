"""Pad existing artwork to square puzzle canvases; preserve every source file."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    'import {puzzlePacks} from "./puzzle-catalog.mjs"; console.log(JSON.stringify(puzzlePacks));'
], cwd=ROOT, encoding='utf-8'))
for journey, pictures in catalog.items():
    output = ROOT / 'assets' / 'puzzles' / journey
    output.mkdir(parents=True, exist_ok=True)
    for picture in pictures:
        source = Image.open(ROOT / 'assets' / 'art' / (picture['id'] + '.webp')).convert('RGBA')
        # Remove large cream margins so each quarter contains recognizable detail.
        mask = Image.new('L', source.size)
        mask.putdata([255 if a > 128 and (max(r, g, b) < 180 or (max(r, g, b)-min(r, g, b) > 25 and min(r, g, b) < 210)) else 0 for r, g, b, a in source.getdata()])
        box = mask.getbbox()
        if box:
            margin = 12
            source = source.crop((max(0, box[0]-margin), max(0, box[1]-margin), min(source.width, box[2]+margin), min(source.height, box[3]+margin)))
        source = ImageOps.contain(source, (608, 608), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (640, 640), '#FAF8F2')
        canvas.paste(source, ((640-source.width)//2, (640-source.height)//2), source)
        canvas.save(output / (picture['id'] + '.webp'), quality=86, method=6)
    print(f'{journey}: {len(pictures)} square pictures prepared.')
