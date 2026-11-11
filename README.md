# MedCUA website

Research site for MedCUA, computer-use agents for medicine, published with GitHub Pages at <https://jakobshen.github.io/MedCUA/>.

The site is static: plain HTML, CSS and a little vanilla JavaScript, with no build step. GitHub Pages serves this directory as it is.

## Pages

| Path | Content |
| --- | --- |
| `index.html` | Homepage: hero, about, call for tasks, team preview |
| `projects/` | Short entries for each project with links to their own sites; BibTeX at `projects/#cite` |
| `team/` | MedCUA core team, affiliations, and funding |
| `contribute/` | "Share a task" form with a worked example (Formspree delivery, email fallback) |
| `404.html` | Not-found page; uses `<base href="/MedCUA/">` because Pages serves it for any missing URL |

## Design system

- `site.css` holds the tokens and shared components. Colours: slate ink (`--ink`, `--ink-2`, `--ink-3`), a teal accent scale (`--accent-50` to `--accent-800`) and an orange evidence signal (`--signal`). The `--navy-*` and `--blue-*` names are aliases kept for older selectors, so changing the `--accent-*` values recolours every page.
- Type is self-hosted in `assets/fonts/` (Geist, Geist Mono, Instrument Serif; SIL Open Font License, licence files alongside). No third-party font or script requests are made.
- Page-specific styles live next to each page (`team/team.css`, `projects/projects.css`, `contribute/style.css`).
- `site.js` handles the sticky header, the mobile menu, reveal-on-scroll, the hero video (paused off screen and for reduced motion) and the agent-steps animation.

## Updating content

- **Team member**: add a card in `team/index.html` and a tile in the homepage avatar wall (`index.html`, section `#team`). Photos are 480×480 WebP files in `assets/team/`.
- **Benchmark numbers** (1,459 cases and 5 task families) mirror MedFlowBench and the paper. The full paper citation is in `projects/index.html`.
- **Institution logos** are in `assets/logos/` and are shown in greyscale until hover.
- **Images**: keep images under about 350 KB, prefer WebP (`cwebp -q 80`), and always set `width`, `height` and `alt`.

## Media sources

- `assets/media/hero-brain*.{mp4,webm}`: native 3D Slicer replay of a MedOpenClaw vessel-mapping run on the public UCSF-PDGM-0036 case, cropped and looped. `hero-brain-poster.*` is the first frame.
- `assets/media/projects/fig-overview.webp` is the overview figure from the MedOpenClaw and MedFlowBench paper.
- `assets/og-image.png` is the social preview image (1200×630).

## Local preview and checks

```bash
python3 -m http.server 8787
```

Open <http://127.0.0.1:8787/>. Run the contribution form checks with:

```bash
node --test tests/contribute.test.mjs
```

## Contribution form

The form uses the existing public Formspree endpoint (`contribute/config.js`) and the same browser draft key as the former MedOpenClaw collection page. Use task descriptions without patient identifiers. Never commit service credentials or submission exports.
