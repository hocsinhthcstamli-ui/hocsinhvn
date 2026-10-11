"""Prepare ten user-supplied computer pictures without modifying originals."""
from pathlib import Path
from PIL import Image,ImageOps
import json
ROOT=Path(__file__).resolve().parents[1]
items=[('yqf1','journey-computer'),('7rvs','computer-devices'),('4vr1','computer-practice'),('cbhj','computer-break'),('lnyk','computer-mouse'),('n4sq','computer-keyboard'),('nj21','computer-typing'),('rvxh','computer-help'),('ucdb','computer-folder'),('xc7','computer-safe')]
items.append(('rjanz','computer-monitor'))
for prefix,name in items:
    source=next(p for p in sorted((ROOT/'anh').glob('*_'+prefix+'*.png')) if ' (1)' not in p.name)
    im=ImageOps.exif_transpose(Image.open(source)).convert('RGB');im.thumbnail((960,960),Image.Resampling.LANCZOS)
    im.save(ROOT/'assets/art'/f'{name}.webp',quality=88,method=6)
(ROOT/'computer-art.mjs').write_text('export const computerArtNames = '+json.dumps([name for _,name in items])+';\n',encoding='utf-8')
print('Prepared 11 illustrations: 10 puzzle pictures and one monitor card')
