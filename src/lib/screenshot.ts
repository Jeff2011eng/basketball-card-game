import html2canvas from 'html2canvas';

let _labFixed = false;
const _originalCssTexts: Map<HTMLStyleElement, string> = new Map();
const _originalLinkHrefs: HTMLLinkElement[] = [];
let _patchedStyle: HTMLStyleElement | null = null;

function labToRgb(labStr: string): string {
  const temp = document.createElement('div');
  temp.style.color = labStr;
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  document.body.appendChild(temp);
  const rgb = getComputedStyle(temp).color;
  document.body.removeChild(temp);
  return rgb;
}

/**
 * Patch the LIVE document's CSS to replace lab() with rgb().
 * This modifies the actual page stylesheets so html2canvas can parse them.
 * Call undoLabFix() after screenshot to restore original CSS.
 */
function applyLabFix() {
  if (_labFixed) return;

  // Collect all CSS from all stylesheets, replace lab(), inject as a single <style>
  const allRules: string[] = [];

  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
          allRules.push(rules[i].cssText);
        }
      } catch {
        // Cross-origin, skip
      }
    }
  } catch {}

  let cssText = allRules.join('\n');
  if (cssText.includes('lab(')) {
    cssText = cssText.replace(/lab\([^)]+\)/g, (match) => labToRgb(match));
  }

  // Disable all existing stylesheets by setting media to "not all"
  try {
    for (const sheet of document.styleSheets) {
      try {
        sheet.media.mediaText = 'not all';
      } catch {}
    }
  } catch {}

  // Also disable <style> and <link> elements
  document.querySelectorAll('style').forEach(el => {
    _originalCssTexts.set(el as HTMLStyleElement, el.textContent || '');
    (el as HTMLStyleElement).disabled = true;
  });
  document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
    _originalLinkHrefs.push(el as HTMLLinkElement);
    (el as HTMLLinkElement).disabled = true;
  });

  // Inject patched CSS as a single <style> element
  _patchedStyle = document.createElement('style');
  _patchedStyle.textContent = cssText;
  document.head.appendChild(_patchedStyle);

  _labFixed = true;
}

function undoLabFix() {
  if (!_labFixed) return;

  // Remove patched style
  if (_patchedStyle) {
    _patchedStyle.remove();
    _patchedStyle = null;
  }

  // Re-enable original stylesheets
  for (const [el] of _originalCssTexts) {
    el.disabled = false;
  }
  _originalCssTexts.clear();

  for (const link of _originalLinkHrefs) {
    link.disabled = false;
  }
  _originalLinkHrefs.length = 0;

  try {
    for (const sheet of document.styleSheets) {
      try {
        sheet.media.mediaText = '';
      } catch {}
    }
  } catch {}

  _labFixed = false;
}

export async function captureElement(element: HTMLElement): Promise<string> {
  applyLabFix();

  // Small delay to let browser re-render with patched CSS
  await new Promise(r => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#111827',
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    return canvas.toDataURL('image/png');
  } finally {
    undoLabFix();
  }
}
