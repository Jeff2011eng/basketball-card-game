import html2canvas from 'html2canvas';

/**
 * Resolve a CSS color function (oklch, lab, etc.) to its computed RGB value.
 * Uses the live browser to resolve the color.
 */
function resolveColorValue(colorFn: string): string | null {
  try {
    const div = document.createElement('div');
    div.style.color = colorFn;
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.pointerEvents = 'none';
    document.body.appendChild(div);
    const rgb = getComputedStyle(div).color;
    document.body.removeChild(div);
    return rgb && rgb !== 'rgba(0, 0, 0, 0)' ? rgb : null;
  } catch {
    return null;
  }
}

/**
 * Build a mapping of oklch()/lab() color function strings → resolved RGB values.
 * Scans all accessible stylesheets in the live document.
 */
function buildColorMap(): Map<string, string> {
  const map = new Map<string, string>();
  const re = /(oklch|lab)\([^)]*\)/gi;

  function scanRules(ruleList: CSSRuleList) {
    for (let i = 0; i < ruleList.length; i++) {
      const rule = ruleList[i];
      let m: RegExpExecArray | null;
      while ((m = re.exec(rule.cssText)) !== null) {
        const fn = m[0];
        if (!map.has(fn)) {
          const rgb = resolveColorValue(fn);
          if (rgb) map.set(fn, rgb);
        }
      }
      // Recurse into @media, @layer, @supports, etc. to catch colors
      // that may not be expanded in the parent rule's cssText
      if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
        scanRules((rule as CSSGroupingRule).cssRules);
      }
    }
  }

  try {
    for (const sheet of document.styleSheets) {
      try {
        scanRules(sheet.cssRules);
      } catch {
        // Cross-origin or inaccessible stylesheet; skip
      }
    }
  } catch {
    // Ignore
  }

  return map;
}

/**
 * Collect all CSS text from the live document's accessible stylesheets.
 * Reads top-level rules only — group rules (@media, @layer, etc.)
 * already include their nested rules in cssText, so no recursion needed.
 */
function collectAllCss(): string {
  const parts: string[] = [];

  try {
    for (const sheet of document.styleSheets) {
      try {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          parts.push(sheet.cssRules[i].cssText);
        }
      } catch {
        // Cross-origin or inaccessible; skip
      }
    }
  } catch {
    // Ignore
  }

  return parts.join('\n');
}

/**
 * Wait for all <img> elements inside the given element to finish loading
 * (or fail), with a per-image timeout.
 */
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve();
          const timer = setTimeout(resolve, 5000);
          const done = () => {
            clearTimeout(timer);
            resolve();
          };
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        })
    )
  );
}

/**
 * Capture a DOM element as a PNG data URL.
 *
 * Handles:
 * - oklch() and lab() CSS color functions (Tailwind v4 uses oklch extensively)
 * - -webkit-background-clip: text (html2canvas doesn't support it)
 * - Cross-origin images (NBA headshots from cdn.nba.com)
 * - Waits for images to load before capture
 *
 * IMPORTANT: This function does NOT touch the live page's DOM.
 * All CSS patching happens inside html2canvas's cloned document via onclone.
 */
export async function captureElement(element: HTMLElement): Promise<string> {
  // ── 1. Wait for all images to load (or fail) ──
  await waitForImages(element);

  // ── 2. Small delay for layout stabilization ──
  await new Promise(r => setTimeout(r, 100));

  // ── 3. Pre-compute color-fixed CSS from live stylesheets ──
  const colorMap = buildColorMap();
  let fixedCss = collectAllCss();
  for (const [fn, rgb] of colorMap) {
    // Simple string replacement – color function strings are unique enough
    fixedCss = fixedCss.split(fn).join(rgb);
  }

  // ── 4. Capture with html2canvas, patching ONLY the cloned document ──
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (clonedDoc) => {
      // Remove all stylesheets in the clone
      clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());

      // Inject the color-fixed CSS
      const style = clonedDoc.createElement('style');
      style.textContent = fixedCss;
      clonedDoc.head.appendChild(style);

      // Fix -webkit-background-clip: text (html2canvas doesn't support it)
      // Replace gradient text with a solid fallback color derived from the gradient
      clonedDoc.querySelectorAll('*').forEach(el => {
        const htmlEl = el as HTMLElement;
        const inlineStyle = htmlEl.getAttribute('style') || '';
        if (
          inlineStyle.includes('-webkit-background-clip') ||
          inlineStyle.includes('background-clip: text')
        ) {
          // Extract the first color from the gradient as fallback
          const gradientMatch = inlineStyle.match(
            /(?:linear-gradient|radial-gradient)\([^,]*,\s*([#\w]+(?:\s*[#\w]*)*)/
          );
          const fallback = gradientMatch ? gradientMatch[1].trim() : '#facc15';

          htmlEl.style.backgroundImage = 'none';
          htmlEl.style.color = fallback;
          htmlEl.style.setProperty('-webkit-background-clip', 'border-box');
          htmlEl.style.setProperty('-webkit-text-fill-color', fallback);
          htmlEl.style.setProperty('background-clip', 'border-box');
        }
      });
    },
  });

  return canvas.toDataURL('image/png');
}
