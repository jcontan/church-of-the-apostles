# Church of the Apostles, Lutheran

The website for Church of the Apostles, Lutheran, 75 17th Avenue, North Tonawanda, New York. The church is a congregation of the North American Lutheran Church.

**Live:** https://jcontan.github.io/church-of-the-apostles/

The site is a single static page with no build step. GitHub Pages serves the `docs/` folder from the `main` branch.

## Making a change

1. Edit the files in `docs/`. Nearly all text is in `docs/index.html`.
2. Preview it locally:
   ```bash
   python3 -m http.server 8738 --directory docs
   ```
   then open http://localhost:8738.
3. Commit and push to `main`. The live site updates in about a minute.

Every change is a commit, so any change can be undone with `git revert`.

## Changing photos

Put the new original photos in a folder, using the file names listed at the top of `tools/build_images.py`, then run:

```bash
python3 tools/build_images.py /path/to/originals
```

That regenerates every size and format in `docs/images/`, plus the home-screen icon and the link-preview image. It needs Pillow (`pip install pillow`). The originals themselves are not stored in this repo.

## Layout

```
docs/                 the live site
  index.html          all content
  styles.css          all styling
  script.js           the opening cross reveal and section fade-ins
  404.html            not-found page
  images/             web images (AVIF, WebP, JPEG at several widths)
  favicon.svg, apple-touch-icon.png, og-image.jpg
tools/build_images.py regenerates the images from the original photos
CLAUDE.md             notes for Claude Code sessions working on the site
```
