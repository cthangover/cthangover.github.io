#!/usr/bin/env bash
# Builds the GitHub Pages copy of the site: ../site -> this folder. The site itself is not changed.
#
#   site_github/build.sh [--cname=<domain>] [--url=<public url>]
#
#   --cname=cthangover.ru               custom domain: writes CNAME (GitHub then serves the site at its root)
#   --url=https://user.github.io/repo/  public address for canonical/og links, robots.txt and sitemap.xml
#                                       (default https://cthangover.ru/, or https://<cname>/ with --cname)
#
# Publish: push the contents of this folder as the root of a repository (or of a gh-pages branch) and pick
# "Deploy from a branch / (root)" in Settings -> Pages. Works on <user>.github.io, on <user>.github.io/<repo>/
# and on a custom domain alike.
#
# What differs from ../site (production there is nginx at the domain root):
# - root-absolute paths (/css/..., /js/..., fetch("/data/mods.json"), "/img/shots/") become relative, so the
#   site also works under /<repo>/; every page is at the top level, so relative == absolute there;
# - .nojekyll: without it Jekyll turns docs/**/*.md into html and parses {{ }} / {% %} in them;
# - 404.html: nginx answers old /docs/<slug> and /quickstart/<lang>/<page> addresses with index.html, whose
#   script redirects to docs.html#/docs/... ; Pages has no such fallback, its 404 page does that instead;
# - sitemap.xml keeps only real files (the /docs/... routes would be 404 on Pages);
# - build scripts, local server, bat/ps1 and __pycache__ are left out.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../site"
CNAME=""
URL=""
REPO=""
for a in "$@"; do
  case "$a" in
    --cname=*) CNAME="${a#--cname=}" ;;
    --repo=*) REPO="${a#--repo=}" ;;
    --url=*) URL="${a#--url=}" ;;
    *) sed -n '2,12p' "$0"; exit 2 ;;
  esac
done
[ -n "$URL" ] || URL="https://${CNAME:-cthangover.ru}/"
URL="${URL%/}/"

# Everything here is generated except this script and the README.
find "$HERE" -mindepth 1 -maxdepth 1 ! -name build.sh ! -name README.md -exec rm -rf {} +

(cd "$SRC" && find . -type f \
  ! -name '*.py' ! -name '*.pyc' ! -name '*.bat' ! -name '*.ps1' \
  ! -name '.gdignore' ! -name '.gitkeep' ! -name 'git.sitemap.xml' \
  ! -path '*/__pycache__/*' -print0) |
  (cd "$SRC" && xargs -0 cp --parents -t "$HERE")

# Root-absolute -> relative. HTML attributes: "/" -> "./", "/x" -> "x" (protocol-relative "//" untouched).
for f in "$HERE"/*.html; do
  sed -i -E 's#(href|src)="/"#\1="./"#g; s#(href|src)="/([^/"])#\1="\2#g' "$f"
done
# JS string literals that start with a site folder or page ("/docs.html#...", "/img/shots/", "/data/mods.json").
for f in "$HERE"/js/*.js; do
  sed -i -E 's#(["'"'"'])/(docs|quickstart|img|data|css|js|examples)([/.])#\1\2\3#g' "$f"
done

# Public address: canonical/og links of the pages and docs.js, robots.txt.
if [ "$URL" != "https://cthangover.ru/" ]; then
  sed -i "s#https://cthangover.ru/#$URL#g" "$HERE"/*.html "$HERE"/js/*.js "$HERE"/robots.txt
fi

# Repository links: the GitHub copy must not send visitors to the Gitea server.
if [ -n "$REPO" ]; then
  find "$HERE" -type f \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.xml" -o -name "*.txt" -o -name "*.md" \) -print0 |
    while IFS= read -r -d "" f; do
      sed -i -e "s|https://git.cthangover.ru/cthangover/cthangover/src/branch/master/site/docs|https://github.com/cthangover/cthangover/tree/master/site/docs|g" -e "s|https://git.cthangover.ru/cthangover/cthangover/src/branch/master/LICENSE|https://github.com/cthangover/cthangover/blob/master/LICENSE|g" -e "s|https://git.cthangover.ru/cthangover/mod_live2d/raw/branch/master/|https://raw.githubusercontent.com/cthangover/mod_live2d/master/|g" -e "s|https://git.cthangover.ru/cthangover|$REPO|g" "$f"
    done
fi

# Sitemap: the real pages only.
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for p in "" docs.html quickstart.html; do
    echo "  <url><loc>$URL$p</loc></url>"
  done
  echo '</urlset>'
} > "$HERE/sitemap.xml"

# 404 page: old path addresses -> hash routes (the base is whatever precedes /docs or /quickstart, so it works
# under /<repo>/ too); anything else gets a link home.
cat > "$HERE/404.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>cthangover — page not found</title>
<script>
(function () {
  var p = location.pathname;
  var m = p.match(/^(.*?)\/(docs|quickstart)(?:\/(.*?))?\/?$/i);
  if (!m) return;
  var base = m[1] + "/";
  location.replace(m[2].toLowerCase() === "docs"
    ? base + "docs.html#/docs/" + (m[3] || "index")
    : base + "quickstart.html" + (m[3] ? "#/quickstart/" + m[3] : ""));
})();
</script>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0e0f15; color: #e8e5de;
         font: 16px/1.5 system-ui, sans-serif; }
  a { color: #d9a441; }
</style>
</head>
<body>
<main><h1>404</h1><p>Page not found. <a id="home" href="/">Go to the home page</a></p></main>
<script>
  /* on <user>.github.io/<repo>/ the home page is /<repo>/ */
  if (/\.github\.io$/i.test(location.hostname)) {
    var seg = location.pathname.split("/")[1];
    if (seg && !/\./.test(seg)) document.getElementById("home").href = "/" + seg + "/";
  }
</script>
</body>
</html>
EOF

touch "$HERE/.nojekyll"
[ -z "$CNAME" ] || echo "$CNAME" > "$HERE/CNAME"

echo "built $HERE ($(find "$HERE" -type f | wc -l) files, url $URL${CNAME:+, cname $CNAME})"
