// Projects page: copy the BibTeX citation. Without JavaScript the button stays
// hidden and the citation can still be selected and copied by hand.
(() => {
  const button = document.querySelector('[data-copy]');
  if (!button) return;
  const source = document.getElementById(button.getAttribute('data-copy'));
  const label = button.querySelector('[data-copy-label]');
  const status = document.querySelector('[data-copy-status]');
  if (!source || !label) return;

  button.hidden = false;
  let resetTimer;

  const setState = (state, text, message) => {
    button.dataset.state = state;
    label.textContent = text;
    if (status) status.textContent = message;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      delete button.dataset.state;
      label.textContent = 'Copy';
      if (status) status.textContent = '';
    }, 2600);
  };

  // Older browsers and non-secure contexts: copy through a temporary textarea.
  const legacyCopy = text => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
    area.remove();
    button.focus();
    return copied;
  };

  // Last resort: select the citation so the reader can press the copy shortcut.
  const selectSource = () => {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  button.addEventListener('click', async () => {
    const text = source.textContent.trim();
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); copied = true; } catch (error) { copied = false; }
    }
    if (!copied) copied = legacyCopy(text);
    if (copied) {
      setState('copied', 'Copied', 'BibTeX citation copied to the clipboard.');
    } else {
      selectSource();
      setState('manual', 'Selected', 'Citation selected. Press Control C or Command C to copy it.');
    }
  });
})();
