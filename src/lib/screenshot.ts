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

function collectFixedCss(): string {
  // Read all CSS from the LIVE document's stylesheets (fully loaded)
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

  let cssText = allRules.join('\n');
  if (cssText.includes('lab(')) {
    cssText = cssText.replace(/lab\([^)]+\)/g, (match) => labToRgb(match));
  }
  return cssText;
}

export async function captureElement(element: HTMLElement): Promise<string> {
  // Pre-collect fixed CSS from the live document
  const fixedCss = collectFixedCss();

  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (doc) => {
      // Remove ALL stylesheets from the cloned document
      doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());

      // Inject the fixed CSS (lab() replaced with rgb()) as a single <style>
      const style = doc.createElement('style');
      style.textContent = fixedCss;
      doc.head.appendChild(style);
    },
  });

  return canvas.toDataURL('image/png');
}
