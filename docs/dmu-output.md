# DMU output

Describes `src/templates/generateDmuHtml.ts`, `src/templates/exportDmuZip.ts`, and `src/templates/primeDmuCss.ts`.

`primeDmuCss` is the raw text of `DMU Examples/PRIME_13WC2610/css/PRIME_DMU.css`. That file is the stylesheet shipped in every zip. The other folders under `DMU Examples/` are reference creatives. The generator does not read their HTML.

## Preview vs export

| | Preview | Export |
| --- | --- | --- |
| HTML | `generateDmuHtml` | `generateDmuHtml` |
| CSS | Link tag plus inlined stylesheet (`withPreviewCss`) | `css/PRIME_DMU.css` in the zip |
| Faculty `blob:` photos | Object URLs | Data URLs |
| Synapse replacement photos | `https://` URL from `data.url` | Same remote URL |
| Download | None | `{activityCode}_DMU.zip` via `file-saver` |

Zip contents:

```text
index.html
css/PRIME_DMU.css
images/PRIME_White.svg
images/live_webinar.svg
```

Logos are loaded from `public/images/` using `import.meta.env.BASE_URL`. Remote artwork, unreplaced faculty photos, and photos replaced through Synapse stay remote (typically `media.primeinc.org`). Mock replacements still use `blob:` in the preview and data URLs in the zip.

## Generated page

- Header logo: `images/PRIME_White.svg`.
- Title, centered horizontally and vertically in the white band under the logo, then a live-webinar mark only when the activity code contains `WC` (case insensitive).
- Date, artwork, `REGISTER NOW!`, and the CME line. The hero (`.img-ladies`) is a block-level 3:2 image inside `.mw500`. That column is `flex: 0 0 46%` (`max-width: 46%`), so the register panel cannot shrink it into a 50/50 split. `.snapshot` takes the rest of the row, stretches to the image height, and overlaps the artwork by 50px. The visible artwork is about 41% of the row and the panel about 59%. `object-fit: cover` crops other ratios from the center on every breakpoint. At `max-width: 810px` (`.break-iPad-p`) the row stacks, the column returns to full width, and the image shifts up 40px. At `max-width: 600px` every `.flexRow` stacks. Those queries match the hand-built files in `DMU Examples/`.
- Overview HTML, then faculty, then the support statement and a second PRIME logo. Faculty photos (`.img-moa`) are circles up to 150px wide, with `object-fit: cover` and a 3px white border. A photo that has not been replaced also has `.img-moa-default`, which sets `object-position: center 15%` so the crop keeps more of the top of the frame. A replaced photo uses only `.img-moa` and center-crops. At `max-width: 600px` the register link stays on one line, and the footer logo stays 72px wide beside the support text.
- Inline `:root` sets `--headerbg`, `--flexfiller`, `--snapshotBG`, and `--ctabutton` from the color pickers. Invalid hex falls back to the defaults in `src/types/dmu.ts`. The picker accepts `#` plus six hex digits.

Register URL:

```text
https://primeinc.org/{code}?utm_campaign={code}&utm_source=MPT&utm_medium=DMU&hr=prime&action=reg
```

`{code}` is `encodeURIComponent(activityCode)`. Hand-built files in `DMU Examples/` also append `&mh=` from `parent.window.MPT.user.mh` in an `onclick`. The generator does not emit that handler.

Text fields other than `overview` are HTML-escaped. `overview` is trusted HTML from the data source.

## Faculty layout

| Count | Rows |
| --- | --- |
| 0 | None |
| 1 | One centered row, `w50` |
| 2 | One row, `w50` |
| 3 | One row, `w33` |
| 4 | Two rows of two, `w50` |
| 5 | Three (`w33`), then two centered (`w50`) |
| 6+ | Rows of three, `w33` |

## Reference CSS

Changing `DMU Examples/PRIME_13WC2610/css/PRIME_DMU.css` changes preview and export, because the app imports that file. The zip ships that same stylesheet as `css/PRIME_DMU.css`. `:root` defaults in that file match the app defaults; the generator overrides the four tokens above per export.
