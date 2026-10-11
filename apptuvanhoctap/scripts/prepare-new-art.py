"""Optimize selected user-supplied pictures without changing their originals.

Requires Pillow. Duplicate downloads and unselected variants remain in anh/.
"""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'art'
ASSETS = [
    ('5xjaw5', 'journey-life', 'cover'),
    ('63bm5k', 'journey-animals', 'cover'),
    ('f30hbv', 'journey-vehicles', 'cover'),
    ('spc1ut', 'animals-discover', 'scene'),
    ('h2cj4c', 'animals-communicate', 'scene'),
    ('1hj9oh', 'animals-practice', 'scene'),
    ('3futy8', 'vehicles-communicate', 'scene'),
    ('vjju5d', 'vehicles-practice', 'scene'),
    ('70pv6n', 'animal-cat', 'card'),
    ('iy2392', 'animal-rabbit', 'card'),
    ('jge47j', 'animal-hen', 'card'),
    ('am1btt', 'animal-duck', 'card'),
    ('ct34b4', 'animal-goat', 'card'),
    ('b7pte1', 'animal-sheep', 'card'),
    ('ulv5gz', 'animal-frog', 'card'),
    ('wm8qom', 'animal-elephant', 'card'),
    ('9ntof9', 'vehicle-car', 'card'),
    ('xa43km', 'vehicle-motorbike', 'card'),
    ('pz930j', 'vehicle-bus', 'card'),
    ('epku3y', 'vehicle-ambulance', 'card'),
    ('l5d6cq', 'vehicle-helicopter', 'card'),
    ('j3957b', 'vehicle-boat', 'card'),
    ('ysagc2', 'vehicle-metro', 'card'),
    ('jnw237', 'sticker-explore', 'sticker'),
    ('g5h46z', 'sticker-care', 'sticker'),
    ('ard74a', 'sticker-choose', 'sticker'),
    ('3782dk', 'sticker-together', 'sticker'),
    ('62vvf3', 'sticker-step', 'sticker'),
    ('vggwac', 'sticker-wave', 'sticker'),
    ('jcd7pj', 'communication-help', 'scene'),
    ('pcyhip', 'communication-together', 'scene'),
    ('8hi18j', 'vehicle-seatbelt', 'scene'),
    ('xos5af', 'vehicle-helmet', 'scene'),
]
OUT.mkdir(parents=True, exist_ok=True)
sources = []
for prefix, name, kind in ASSETS:
    source = next(p for p in sorted((ROOT/'anh').glob(f'Gemini_Generated_Image_{prefix}*.png')) if ' (1)' not in p.name)
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    # Keep the complete scene and real cream background, never crop off limbs.
    image.thumbnail((960, 720) if kind in ('cover', 'scene') else (480, 480), Image.Resampling.LANCZOS)
    target = OUT / (name + '.webp')
    image.save(target, 'WEBP', quality=88, method=6)
    sources.append({'name':name,'kind':kind,'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':target.relative_to(ROOT).as_posix(),'width':image.width,'height':image.height,'bytes':target.stat().st_size})
(OUT/'new-sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'new-art.mjs').write_text('// Selected user-supplied artwork; regenerate with scripts/prepare-new-art.py.\nexport const newArtNames = '+json.dumps([a[1] for a in ASSETS],indent=2)+';\n',encoding='utf-8')
print(f'{len(sources)} assets, {sum(item["bytes"] for item in sources):,} bytes')
