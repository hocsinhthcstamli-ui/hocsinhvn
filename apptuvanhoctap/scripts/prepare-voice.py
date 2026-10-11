"""Build public Vietnamese lesson recordings (development only).

Requires edge-tts and Node. Reads the shipped curriculum automatically.
No learner data or credentials are sent to the speech service.
"""
import asyncio
import hashlib
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'voice'
VOICE = 'vi-VN-HoaiMyNeural'

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    export = subprocess.run([
        'node', '--input-type=module', '-e',
        'import {completeSeedData} from "./content/seed.mjs"; '
        'console.log(JSON.stringify([...new Set(completeSeedData().lessons.flatMap(l=>l.cards.map(c=>c.text)))]));'
    ], cwd=ROOT, check=True, capture_output=True, text=True, encoding='utf-8')
    texts = json.loads(export.stdout)
    manifest = {}
    gate = asyncio.Semaphore(4)
    async def generate(text):
        name = hashlib.sha256(text.encode()).hexdigest()[:20] + '.mp3'
        target = OUT / name
        async with gate:
            if not target.exists() or target.stat().st_size < 1000:
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(text, VOICE, rate='-10%').save(str(target))
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
            manifest[text.lower().strip()] = '/assets/voice/' + name
    await asyncio.gather(*(generate(t) for t in texts))
    (ROOT / 'voice-manifest.mjs').write_text(
        '// Public curriculum recordings; vi-VN-HoaiMyNeural. Regenerate with scripts/prepare-voice.py.\n'
        + 'export const voiceClips = ' + json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f'{len(manifest)} Vietnamese recordings ready.', flush=True)

asyncio.run(main())
