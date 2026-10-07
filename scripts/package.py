from pathlib import Path
import json, zipfile
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "extension/manifest.json").read_text())
out = root / "dist" / ("biff-ticket-view-" + manifest["version"] + ".zip")
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root / "extension").rglob("*")):
        if p.is_file(): z.write(p, p.relative_to(root / "extension"))
print(out.name)
