# MedCUA

Research site for computer-use agents in medicine, published on GitHub Pages.

- `index.html` introduces the initiative and its research roadmap.
- `projects/` links to the MedOpenClaw and MedFlowBench project pages.
- `contribute/` contains the workflow collection form and read-only example.

The site is static. Serve this directory with `python3 -m http.server` for a local preview. Run the form model checks with `node --test tests/contribute.test.mjs`.

The contribution form uses the existing public Formspree endpoint and the same browser draft key as the former MedOpenClaw collection page. Use task descriptions without patient identifiers. Never commit service credentials or submission exports.
