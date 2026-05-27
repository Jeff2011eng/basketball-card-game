import html2canvas from 'html2canvas';

function fixLabColors(doc: Document) {
  // Walk through all stylesheets and remove rules containing lab()
  try {
    const sheets = doc.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
      try {
        const rules = sheets[i].cssRules;
        for (let j = rules.length - 1; j >= 0; j--) {
          const css = rules[j].cssText;
          if (css && css.includes('lab(')) {
            sheets[i].deleteRule(j);
          }
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
  } catch {
    // Ignore
  }

  // For all elements in the document, apply computed styles as inline overrides
  // for properties that might have used lab() colors
  const colorProps = ['color', 'background-color', 'border-color', 'outline-color'];
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach((el: any) => {
    // Get computed style from the cloned document itself (browser already resolved lab() to rgb())
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) return;
    for (const prop of colorProps) {
      const val = cs.getPropertyValue(prop);
      if (val) {
        el.style.setProperty(prop, val, 'important');
      }
    }
    // Also fix background-image gradients that might contain lab()
    const bg = cs.getPropertyValue('background-image');
    if (bg && bg.includes('lab(')) {
      // Can't easily fix gradients, just clear them
      el.style.setProperty('background-image', 'none', 'important');
    }
    const bc = cs.getPropertyValue('border');
    if (bc && bc.includes('lab(')) {
      el.style.setProperty('border-color', cs.getPropertyValue('border-color'), 'important');
    }
  });
}

export async function captureElement(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (_doc, _element) => {
      fixLabColors(_doc);
    },
  });
  return canvas.toDataURL('image/png');
}
