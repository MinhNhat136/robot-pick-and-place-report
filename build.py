#!/usr/bin/env python3
"""Assemble index.html from src/.

    python3 build.py              # build once (+ measure PDF page numbers for the table of contents)
    python3 build.py --no-pages   # build once, skip the page-number measurement
    python3 build.py --watch      # rebuild when anything in src/ changes (no page numbers)

Inputs
  src/layout.html      page shell with @styles, @scripts, @nav and @sections markers
  src/nav.json         sidebar groups and the order of sections (+ *_en / *_ja labels)
  src/sections/*.html  one <section> per file
  src/sections/i18n/NN-name.<lang>.html
                       optional translation of a section (same markup, translated text). Its
                       cards are added next to the Vietnamese ones, tagged data-i18n="<lang>";
                       ui/lang.js + lang.css show the cards of the chosen language.

Page numbers in the printed table of contents: Chrome cannot compute them in CSS, so build.py
prints the report in headless Chrome for every language (?paginate=1 adds invisible
@@key@@ markers to headings), reads the page of each marker with pdftotext and stores the result in
data/print-pages.json, tied to a hash of the generated page. ui/print.js only uses numbers whose hash
matches, so stale numbers are never printed. Needs google-chrome/chromium and pdftotext (poppler).

index.html is a generated file that opens directly from disk (file://), so the report
needs no server. Edit src/, config/, data/ or assets/, never index.html.
Standard library only.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"

# Load order matters: tokens before components; core before ui/charts; main last.
STYLES = [
    "assets/css/tokens.css",
    "assets/css/base.css",
    "assets/css/layout.css",
    "assets/css/components.css",
    "assets/css/diagram.css",
    "assets/css/compare.css",
    "assets/css/schedule.css",
    "assets/css/media.css",
    "assets/css/toc.css",
    "assets/css/problem.css",
    "assets/css/infra.css",
    "assets/css/deliver.css",
    "assets/css/loop.css",
    "assets/css/charts.css",
    "assets/css/datasim.css",
    "assets/css/glass.css",
    "assets/css/tuner.css",
    "assets/css/lang.css",
    "assets/css/responsive.css",
    "assets/css/print.css",
]
SCRIPTS = [
    "config/report.config.js",
    "assets/js/core/report.js",
    "assets/js/core/stats.js",
    "assets/js/core/config.js",
    "data/charts.js",
    "assets/js/ui/tabs.js",
    "assets/js/ui/lightbox.js",
    "assets/js/ui/filters.js",
    "assets/js/ui/print.js",
    "assets/js/ui/video.js",
    "assets/js/ui/toc.js",
    "assets/js/ui/jump.js",
    "assets/js/ui/refract.js",
    "assets/js/ui/liquid.js",
    "assets/js/ui/tuner.js",
    "assets/js/ui/lang.js",
    "assets/js/ui/loop.js",
    "assets/js/ui/router.js",
    "assets/js/ui/datasim.js",
    "assets/js/ui/motion.js",
    "assets/js/ui/model.js",
    "assets/js/ui/pipeline.js",
    "assets/js/charts/svg.js",
    "assets/js/charts/tooltip.js",
    "assets/js/charts/ci-chart.js",
    "assets/js/charts/bar-chart.js",
    "assets/js/charts/line-chart.js",
    "assets/js/charts/charts.js",
    "assets/js/main.js",
]


LANGS = ("ja", "en")


def tr(obj: dict, key: str) -> str:
    """data-tr-<lang> attributes for the translations of obj[key] (keys like label_en); ui/lang.js swaps them in."""
    return "".join(f' data-tr-{l}="{html.escape(obj[f"{key}_{l}"])}"' for l in LANGS if obj.get(f"{key}_{l}"))


def render_nav(groups: list[dict]) -> str:
    out = []
    for g in groups:
        items, n = [], 0  # numbering restarts in every group
        for it in g["items"]:
            n += 1
            items.append(f'        <a href="#{it["id"]}"><span class="n">{n:02d}</span>'
                         f'<span{tr(it, "label")}>{html.escape(it["label"])}</span></a>')
        out.append(
            f'    <div class="nav-group" data-hue="{g["hue"]}">\n'
            f'      <div class="nav-group-head"><span class="bar"></span>'
            f'<span style="display:flex;flex-direction:column;gap:2px"><span class="k"{tr(g, "kicker")}>{html.escape(g["kicker"])}</span>'
            f'<span class="t"{tr(g, "title")}>{html.escape(g["title"])}</span></span></div>\n'
            f'      <div class="nav-items">\n' + "\n".join(items) + "\n      </div>\n    </div>"
        )
    return "\n".join(out)


SECTION_RE = re.compile(r"^(<section[^>]*>)(.*)</section>$", re.S)


def tag_children(inner: str, lang: str) -> str:
    """Mark the top-level children of a section (lines indented by exactly two spaces)."""
    return re.sub(r"^  <(\w+)", lambda m: f'  <{m.group(1)} data-i18n="{lang}"', inner, flags=re.M)


def with_translations(path: Path, body: str, problems: list[str]) -> str:
    """Merge src/sections/i18n/<name>.<lang>.html into the section, if any exist."""
    found = [(lang, p) for lang in LANGS if (p := SRC / "sections" / "i18n" / f"{path.stem}.{lang}.html").exists()]
    if not found:
        return body
    m = SECTION_RE.match(body)
    if not m:
        problems.append(f"{path.name}: cannot merge translations (section markup not recognised)")
        return body
    open_tag, inner = m.groups()
    parts = [tag_children(inner, "vi")]
    attrs = [f'data-i18n-langs="vi {" ".join(l for l, _ in found)}"']
    for lang, p in found:
        t = SECTION_RE.match(p.read_text(encoding="utf-8").strip())
        if not t:
            problems.append(f"{p.relative_to(ROOT)}: section markup not recognised")
            continue
        for key in ("title", "kicker"):
            a = re.search(rf'\bdata-{key}="([^"]*)"', t.group(1))
            if a:
                attrs.append(f'data-{key}-{lang}="{a.group(1)}"')
        parts.append(tag_children(t.group(2), lang))
    return open_tag[:-1] + " " + " ".join(attrs) + ">" + "".join(parts) + "</section>"


def ver(path: str) -> str:
    """Cache-busting token: file modification time, so the browser reloads changed assets."""
    return str(int((ROOT / path).stat().st_mtime))


def build(pages: bool = True) -> None:
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    nav = json.loads((SRC / "nav.json").read_text(encoding="utf-8"))

    problems, sections = [], []
    listed = set()
    for g in nav["groups"]:
        for it in g["items"]:
            path = SRC / "sections" / it["file"]
            listed.add(path.name)
            if not path.exists():
                problems.append(f"missing section file: {path.relative_to(ROOT)}")
                continue
            body = path.read_text(encoding="utf-8").strip()
            m = re.search(r'<section[^>]*\bid="([^"]+)"', body)
            if not m or m.group(1) != it["id"]:
                problems.append(f'{path.name}: <section id> should be "{it["id"]}"')
            body = with_translations(path, body, problems)
            sections.append(f"<!-- ===== {it['file']} ===== -->\n{body}")
    for f in sorted((SRC / "sections").glob("*.html")):
        if f.name not in listed:
            print(f"warning: {f.name} is not listed in src/nav.json and was skipped")
    for a in STYLES + SCRIPTS:
        if not (ROOT / a).exists():
            problems.append(f"missing asset: {a}")
    if problems:
        sys.exit("build failed:\n  " + "\n  ".join(problems))

    page = (
        layout.replace("<!-- @styles -->", "\n".join(f'<link rel="stylesheet" href="{s}?v={ver(s)}">' for s in STYLES))
        .replace("<!-- @scripts -->", "\n".join(f'<script src="{s}?v={ver(s)}" defer></script>' for s in SCRIPTS))
        .replace("<!-- @nav -->", render_nav(nav["groups"]))
        .replace("<!-- @sections -->", "\n\n".join(sections))
    )
    banner = "<!-- GENERATED by build.py from src/ — do not edit this file directly. -->\n"
    page = page.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + banner, 1)
    digest = hashlib.sha1(page.encode("utf-8")).hexdigest()[:12]
    write_page(page, digest)
    print(f"built {OUT.name}: {len(sections)} sections, {len(STYLES)} stylesheets, {len(SCRIPTS)} scripts")
    if pages:
        measure_pages(page, digest)


PAGES = ROOT / "data" / "print-pages.json"


def write_page(page: str, digest: str) -> None:
    """index.html + the build hash and the stored page numbers (used by ui/print.js)."""
    data = {}
    if PAGES.exists():
        try:
            data = json.loads(PAGES.read_text(encoding="utf-8"))
        except ValueError:
            data = {}
    inline = (f"<script>window.ReportBuildHash={json.dumps(digest)};"
              f"window.ReportPrintPages={json.dumps(data, ensure_ascii=False, separators=(',', ':'))};</script>\n")
    OUT.write_text(page.replace("</head>", inline + "</head>", 1), encoding="utf-8")


def measure_pages(page: str, digest: str) -> None:
    """Print the report in headless Chrome per language; record the page of every heading."""
    if PAGES.exists() and json.loads(PAGES.read_text(encoding="utf-8") or "{}").get("hash") == digest:
        print("page numbers: up to date")
        return
    chrome = next((c for c in ("google-chrome", "chromium", "chromium-browser") if shutil.which(c)), None)
    if not chrome or not shutil.which("pdftotext"):
        print("warning: page numbers skipped (needs google-chrome/chromium and pdftotext); the PDF table of contents has none")
        return
    t0 = time.time()
    jobs = ("vi", "en", "ja")
    sets = {}
    with tempfile.TemporaryDirectory() as tmp:
        procs = []
        for i, lang in enumerate(jobs):
            pdf = Path(tmp) / f"{i}.pdf"
            url = f"{OUT.resolve().as_uri()}?lang={lang}&paginate=1"
            cmd = [chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--user-data-dir={tmp}/u{i}",
                   "--virtual-time-budget=10000", f"--print-to-pdf={pdf}", url]
            procs.append((lang, pdf, subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)))
        deadline = time.time() + 90   # all three print in parallel; a normal run takes ~10 s
        for lang, pdf, proc in procs:
            try:
                proc.wait(timeout=max(1, deadline - time.time()))
            except subprocess.TimeoutExpired:
                proc.kill()
                print(f"warning: page numbers: {lang} timed out after 90 s")
            if not pdf.exists():
                print(f"warning: page numbers: {lang} did not print")
                continue
            text = subprocess.run(["pdftotext", str(pdf), "-"], capture_output=True, text=True).stdout
            found = {}
            for n, pg in enumerate(text.split("\f"), start=1):
                for key in re.findall(r"@@([a-z0-9-]+)@@", pg):
                    found.setdefault(key, n)
            sets[lang] = found
    PAGES.write_text(json.dumps({"hash": digest, "sets": sets}, ensure_ascii=False, indent=1), encoding="utf-8")
    write_page(page, digest)
    counts = ", ".join(f"{k} {len(v)}" for k, v in sets.items())
    print(f"page numbers: measured in {time.time() - t0:.0f} s ({counts} headings)")


def watch() -> None:
    def stamp() -> float:
        return max(p.stat().st_mtime for p in SRC.rglob("*") if p.is_file())
    last = 0.0
    print("watching src/ … (Ctrl+C to stop)")
    while True:
        s = stamp()
        if s != last:
            last = s
            try:
                build(pages=False)
            except SystemExit as e:
                print(e)
        time.sleep(0.5)


if __name__ == "__main__":
    watch() if "--watch" in sys.argv else build(pages="--no-pages" not in sys.argv)
