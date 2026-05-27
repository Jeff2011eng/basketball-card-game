import html2canvas from 'html2canvas';

function labToRgb(labStr: string): string {
  const temp = document.createElement('div');
  temp.style.color = labStr;
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  temp.style.pointerEvents = 'none';
  document.body.appendChild(temp);
  const rgb = getComputedStyle(temp).color;
  document.body.removeChild(temp);
  return rgb;
}

function fixLabColors(doc: Document) {
  // Replace lab() with rgb() in all <style> elements, preserving the rest of the CSS
  const styleElements = doc.querySelectorAll('style');
  styleElements.forEach(style => {
    if (style.textContent && style.textContent.includes('lab(')) {
      style.textContent = style.textContent.replace(/lab\([^)]+\)/g, (match) => {
        return labToRgb(match);
      });
    }
  });
}

export async function captureElement(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (_doc) => {
      fixLabColors(_doc);
    },
  });
  return canvas.toDataURL('image/png');
}
