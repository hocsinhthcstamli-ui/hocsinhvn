"""Extract teaching pictures from the user's existing PDF materials.

Development only: Pillow + pymupdf. Originals remain untouched.
"""
from pathlib import Path
import hashlib
import json
import pymupdf as fitz
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'cards'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}
sources = []

def save(page, rect, text, source):
    text = text.lower().strip()
    if not text or text in manifest:
        return
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=rect, alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    # Remove the thin table rules at crop edges, retaining the actual drawing.
    ink = im.convert('L')
    draw = ImageDraw.Draw(im)
    for y in range(im.height):
        if im.height*.08 < y < im.height*.88:
            continue
        if sum(ink.getpixel((x,y)) < 100 for x in range(im.width)) > im.width*.7:
            draw.line((0,y,im.width,y), fill='white', width=2)
    for x in range(im.width):
        if im.width*.08 < x < im.width*.92:
            continue
        if sum(ink.getpixel((x,y)) < 100 for y in range(im.height)) > im.height*.7:
            draw.line((x,0,x,im.height), fill='white', width=2)
    bounds = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).point(lambda x: 255 if x > 35 else 0).getbbox()
    if bounds:
        im = im.crop(bounds)
    im.thumbnail((300, 260), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (320, 280), 'white')
    canvas.paste(im, ((320-im.width)//2, (280-im.height)//2))
    name = hashlib.sha256(text.encode()).hexdigest()[:16] + '.webp'
    canvas.save(OUT/name, 'WEBP', quality=90)
    manifest[text] = '/assets/cards/' + name
    sources.append({'text': text, 'source': source, 'page': page.number+1, 'crop': list(rect), 'file': name})

for path in ROOT.glob('*.pdf'):
    doc = fitz.open(path)
    if len(doc) not in (4, 13):
        continue
    for page in doc:
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                text = ''.join(s['text'] for s in line['spans']).strip()
                if not text or text == 'vào trong':
                    continue
                x0,y0,x1,y1 = line['bbox']
                cx = (x0+x1)/2
                half, height = (51, 84) if len(doc)==4 else (95, 183)
                save(page, fitz.Rect(cx-half,y1+5,cx+half,y1+5+height),text,path.name)

# Six-card sheets: use the inner picture layer, excluding the baked label.
doc = fitz.open(ROOT/'AAC TONG HOP.pdf')
pages = {
    4: ['trán','đầu','cằm','má','tóc','tai'],
    19: ['trái tim','tam giác vuông','hình thoi','tam giác','hình tròn','hình vuông'],
    20: ['xương','lục giác'],
    21: ['cầu vồng','đỏ','đen','hồng','nâu','màu tím'],
    22: ['trắng','vàng','xám','xanh dương','xanh lá'],
    24: ['bác sĩ','thầy giáo','ông bà','bánh mì','bánh','cá'],
    25: ['canh','ăn cơm','mì'],
    29: ['nước mía','nước cam','uống nước','nước dâu','nước ngọt','sữa đậu nành'],
    32: ['vui','buồn','đói','không thích','khát','sợ'],
    33: ['mệt','nóng','ồn','lạnh','khóc'],
    39: ['tất cả','bên phải','bên trái','dưới','trên','giữa'],
    40: ['ngoài','trong','đi vệ sinh','chải đầu','đánh răng'],
}
for n, labels in pages.items():
    page = doc[n-1]
    boxes = page.get_image_info()[1::2]
    if len(boxes) != len(labels):
        print('Skipped sheet with unexpected image count:', n)
        continue
    for item, text in zip(boxes, labels):
        box = fitz.Rect(item['bbox'])
        box = fitz.Rect(box.x0+5, box.y0+5, box.x1-5, box.y0+box.height*.72)
        save(page, box, text, 'AAC TONG HOP.pdf')

(ROOT/'card-art-manifest.mjs').write_text(
    '// Pictures extracted from user-supplied teaching materials; see assets/cards/sources.json.\n'
    + 'export const cardPictures = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(OUT/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(manifest)} teaching pictures ready.')
