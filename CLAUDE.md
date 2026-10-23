# Church of the Apostles site: notes for Claude

A one-page static site for Church of the Apostles, Lutheran (NALC), North Tonawanda, NY. Jason Contangelo (GitHub `jcontan`) maintains it for his dad's church. The audience skews elderly, so readability and obvious affordances matter more than cleverness.

## Hosting
- GitHub Pages, repo `jcontan/church-of-the-apostles`, serving the `main` branch `/docs` folder. There is no build step and no Actions workflow; pushing to `main` deploys.
- Live at https://jcontan.github.io/church-of-the-apostles/. No custom domain yet. The old domain `churchoftheapostleslutheran.org` lapsed and the church may get a new one.
- On this Mac the active `gh` account is often `bobbycorpllc`. Run repo operations as `jcontan` (for example `GH_TOKEN=$(gh auth token --user jcontan) gh ...`) without switching the global account.

## Where content lives (`docs/index.html`)
- **Service times** appear in three places, so keep them in sync:
  1. the opening screen line `.tp.bottom .hours`
  2. the `.ordo` list under "The Holy Eucharist"
  3. the meta description, og:description and JSON-LD `description` in `<head>`
- **Phones and email:** the `.contact` list under "Come and See", plus the JSON-LD `telephone`/`email`. The parish office is the church's main number; the pastor's number is listed separately.
- **Pastor:** "The Rev. Troy A. Mulvaine", in the "Evangelical Catholic" section and in the JSON-LD `employee`.
- **Absolute URLs** (canonical, og:url, og:image, JSON-LD url/image) use the github.io address. Update all of them if a custom domain is added, and add `docs/CNAME`.

## Design system: "Rubric"
Modelled on a printed missal: black and red on cream paper.
- **Fonts:** EB Garamond (Google Fonts) throughout; UnifrakturMaguntia only for the single red drop capital (a nod to Luther's Fraktur Bible).
- **Colors** are tokens in `:root` in `styles.css`: `--paper #f3ebdd`, `--ink #1e1915`, `--soft #5e5248`, `--red #b1281e`, `--rule #cbb99f`. Red marks "rubrics": section labels, margin notes, ℣/℟ marks, plate numbers.
- **Structure:**
  - Sections are numbered I, II, III, with italic "Of …" margin notes. The margin column collapses inline at 720px and below.
  - Photos are captioned "Plate i/ii/iii."
  - Lists of times or contacts use the `.ordo` dot-leader pattern.
- **Copy** is deliberately minimal: core information only. There is no seasonal schedule, sermons or gallery unless Jason asks for them.

## The opening cross reveal (`script.js`)
- A sticky stage inside a 180vh section, so the reveal takes about 0.8 screens of scrolling. The sanctuary photo fills it, and **eight paper-coloured panels** (`.paper i`) cover the photo except for a cross-shaped opening: four corners between the arms, plus four bands beyond the arm ends. Scrolling slides the panels apart, growing the cross (progress^1.7, so it starts moving right away) until the photo fills the screen. Jason found the earlier 270vh / cubed version far too slow.
- **Smoothness matters.** Everything per frame is `transform` or `opacity`; nothing should change layout or force a repaint. An earlier version animated `mask-size` and was jittery on iPhone.
  - Don't reintroduce CSS masks or clip-path animation.
  - Don't set `object-position` per frame.
  - Don't read `innerHeight` or call `getBoundingClientRect` per frame; progress comes from `pageYOffset`.
  - Keep layers small: each panel is screen-sized, with its anchor clamped onto the screen. Huge layers stutter on 3× iPhone screens.
  - Ignore `resize` events where the stage size didn't change. Safari fires them as the address bar slides during the first scroll, and re-laying out there caused a visible hitch.
- Scroll input is smoothed with an 85ms time constant, based on elapsed time rather than per frame, so 60Hz and 120Hz iPhones behave the same. Raising it smooths more but lags the finger.
- The photo starts at 2.4× zoom, framed on the crucifix (23.7% across and 21.5% down in the sanctuary crop), and pulls back to 1×. Translation is clamped so the scaled photo always covers the stage.
- The cross's starting size and position come from measuring the actual gap between the title (`.tp.top`) and the "Scroll down" block (`.tp.bottom`), so it can't overlap them on any screen. The script re-measures on resize, rotation and web-font load.
- The thin red rule is an SVG outline, sized once. It vanishes the moment scrolling starts and fades back in at the top.
- **Old browsers:** the head script adds the `js` class only if IntersectionObserver and requestAnimationFrame exist. Without it, the page shows a plain one-screen title page with a static ✠ (`.still-mark`), no photo or animation, and all sections visible. Safari before iOS 15.4 has no `svh`, so the script sizes the stage to `innerHeight` on load and rotation.
- `prefers-reduced-motion` keeps the title page with a static cross and turns off the fades and the chevron animation.
- If the sanctuary crop changes in `tools/build_images.py`, update the crucifix fractions in `script.js`.

## Cache busting
`index.html` loads `styles.css?v=N` and `script.js?v=N`. GitHub Pages lets browsers cache files for 10 minutes, so **bump N whenever `styles.css` or `script.js` changes**. Otherwise returning visitors can get new HTML with an old stylesheet, which breaks the opening.

## Images
Generated by `tools/build_images.py` from the original photos, which are not in the repo. Each photo is served via `<picture>` as AVIF, then WebP, then JPEG.

## Checking changes
Serve `docs/` locally (`python3 -m http.server 8738 --directory docs`). Check the opening screen at 1280×800, 1366×640, 375×667, 320×568 (iPhone SE) and 667×375 (phone held sideways). iPhone Safari is the riskiest browser for the sticky scroll; test changes to the reveal on a real iPhone.
