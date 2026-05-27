import html2canvas from 'html2canvas';

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

export async function captureElement(element: HTMLElement): Promise<string> {
  // Step 1: Collect ALL CSS from the live document's stylesheets
  const allRules: string[] = [];
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
          allRules.push(rules[i].cssText);
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
  } catch {}

  let fixedCss = allRules.join('\n');
  const hasLab = fixedCss.includes('lab(');
  if (hasLab) {
    fixedCss = fixedCss.replace(/lab\([^)]+\)/g, (match) => labToRgb(match));
  }

  // Step 2: Swap the live document's CSS to the fixed version
  // Remove all existing stylesheets
  const removedElements: { el: HTMLElement; parent: HTMLElement | null; next: HTMLElement | null }[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
    const htmlEl = el as HTMLElement;
    removedElements.push({
      el: htmlEl,
      parent: htmlEl.parentElement,
      next: htmlEl.nextElementSibling as HTMLElement | null,
    });
    htmlEl.remove();
  });

  // Inject fixed CSS
  const fixedStyle = document.createElement('style');
  fixedStyle.setAttribute('data-poster-fix', 'true');
  fixedStyle.textContent = fixedCss;
  document.head.appendChild(fixedStyle);

  // Step 3: Wait for browser to re-render with fixed CSS
  await new Promise(r => setTimeout(r, 200));

  let dataUrl: string;
  try {
    // Step 4: Capture with html2canvas (reads from document.styleSheets which now has no lab())
    const canvas = await html2canvas(element, {
      backgroundColor: '#111827',
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    dataUrl = canvas.toDataURL('image/png');
  } finally {
    // Step 5: Restore original CSS
    fixedStyle.remove();
    for (const { el, parent, next } of removedElements) {
      if (parent) {
        if (next) {
          parent.insertBefore(el, next);
        } else {
          parent.appendChild(el);
        }
      }
    }
  }

  return dataUrl;
}
