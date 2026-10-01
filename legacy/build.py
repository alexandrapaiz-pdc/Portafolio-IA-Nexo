"""Inline logos as data URIs so the page is a single self-contained HTML file."""
import base64, pathlib, re
root = pathlib.Path(__file__).parent
src = (root / "src/index.html").read_text()
mime = {".otf": "font/otf", ".png": "image/png"}
def inline(m):
    f = root / "src" / m.group(1)
    return "data:%s;base64,%s" % (mime[f.suffix], base64.b64encode(f.read_bytes()).decode())
out = re.sub(r'(?<=["(])(assets/[\w.-]+)(?=[")])', lambda m: inline(m), src)
(root / "dist").mkdir(exist_ok=True)
(root / "dist/index.html").write_text(out)
print("dist/index.html", len(out) // 1024, "KB")
