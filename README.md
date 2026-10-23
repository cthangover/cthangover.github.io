# cthangover site — GitHub Pages build

Generated from `../site` by `build.sh`; do not edit the files here, edit `site/` and rebuild.

```bash
site_github/build.sh                          # address stays https://cthangover.ru/ (no CNAME)
site_github/build.sh --cname=cthangover.ru    # custom domain served by GitHub Pages
site_github/build.sh --url=https://<user>.github.io/<repo>/
```

Publish: push the contents of this folder as the root of a repository (or a `gh-pages` branch), then
Settings → Pages → Deploy from a branch → `/ (root)`. Works on `<user>.github.io`, on
`<user>.github.io/<repo>/` and on a custom domain (DNS: A records to GitHub Pages, or a CNAME record to
`<user>.github.io` for a subdomain).

Differences from `site/` (see the header of `build.sh`): relative paths instead of root-absolute ones,
`.nojekyll`, a `404.html` that redirects the old `/docs/...` and `/quickstart/...` addresses, a sitemap of
the real pages only, no build scripts.
