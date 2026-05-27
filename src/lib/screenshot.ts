import html2canvas from 'html2canvas';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a CSS color function (oklch, lab, etc.) to its computed RGB value.
 * Uses the live browser via a temporary element.
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

// ─── CSS custom property overrides ───────────────────────────────────────────

interface CssVarOverride {
  /** CSS custom property name, e.g. "--color-gray-900" */
  name: string;
  /** Resolved rgb(...) value */
  value: string;
}

/**
 * Scan ALL accessible stylesheets (including @media, @layer, @supports nests)
 * for CSS custom properties whose value uses oklch() or lab().
 *
 * Returns a list of `:root`-level overrides with resolved RGB values.
 * We inject these into the html2canvas clone so that var() references
 * resolve to rgb() instead of oklch()/lab() — which html2canvas cannot parse.
 */
function buildCustomPropertyOverrides(): CssVarOverride[] {
  const overrides: CssVarOverride[] = [];
  const seen = new Set<string>();

  function scan(ruleList: CSSRuleList) {
    for (let i = 0; i < ruleList.length; i++) {
      const rule = ruleList[i];

      // CSSStyleRule → has .style
      if ('style' in rule && (rule as CSSStyleRule).style) {
        const style = (rule as CSSStyleRule).style;
        for (let j = 0; j < style.length; j++) {
          const prop = style[j];
          if (prop.startsWith('--')) {
            const val = style.getPropertyValue(prop).trim();
            if ((val.includes('oklch(') || val.includes('lab(')) && !seen.has(prop)) {
              seen.add(prop);
              const rgb = resolveColorValue(val);
              if (rgb) {
                overrides.push({ name: prop, value: rgb });
              }
            }
          }
        }
      }

      // Recurse into grouping rules (@media, @layer, @supports, @scope, etc.)
      if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
        scan((rule as CSSGroupingRule).cssRules);
      }
    }
  }

  try {
    for (const sheet of document.styleSheets) {
      try {
        scan(sheet.cssRules);
      } catch {
        // Cross-origin or inaccessible; skip
      }
    }
  } catch {
    // Ignore
  }

  return overrides;
}

// ─── direct color replacement (for non-custom-property usage) ────────────────

/**
 * Build a map of ALL unique oklch()/lab() color function strings → RGB.
 * Used to patch any remaining occurrences in inline styles or <style> elements
 * that don't go through CSS custom properties.
 */
function buildColorMap(): Map<string, string> {
  const map = new Map<string, string>();
  const re = /(oklch|lab)\([^)]*\)/gi;

  function scan(ruleList: CSSRuleList) {
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
      if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
        scan((rule as CSSGroupingRule).cssRules);
      }
    }
  }

  try {
    for (const sheet of document.styleSheets) {
      try {
        scan(sheet.cssRules);
      } catch { /* skip */ }
    }
  } catch { /* ignore */ }

  return map;
}

// ─── image waiting ───────────────────────────────────────────────────────────

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) return resolve();
          const timer = setTimeout(resolve, 8000);
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

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Capture a DOM element as a PNG data URL.
 *
 * Strategy:
 * - KEEPS original <link>/<style> stylesheets in the clone (never removes them)
 * - Injects ``:root { --var: rgb(...) !important; }`` overrides for every
 *   CSS custom property that has an oklch()/lab() value — html2canvas then
 *   resolves var() references against these rgb() overrides instead of
 *   encountering oklch()/lab() it cannot parse.
 * - Also patches any remaining oklch()/lab() in inline <style> text and
 *   element style attributes.
 */
export async function captureElement(element: HTMLElement): Promise<string> {
  // 1. Wait for images
  await waitForImages(element);

  // 2. Stabilise layout
  await new Promise(r => setTimeout(r, 150));

  // 3. Pre-compute overrides (reads live document — safe, read‑only)
  const cssVarOverrides = buildCustomPropertyOverrides();
  const colorMap = buildColorMap();

  // 4. Capture
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (clonedDoc) => {
      // ── Inject CSS custom property overrides ──
      // This is the key fix: instead of removing original stylesheets,
      // we add an overriding :root block at the end of the cascade.
      if (cssVarOverrides.length > 0) {
        const overrideStyle = clonedDoc.createElement('style');
        overrideStyle.textContent =
          ':root {\n' +
          cssVarOverrides.map(o => `  ${o.name}: ${o.value} !important;`).join('\n') +
          '\n}';
        clonedDoc.head.appendChild(overrideStyle);
      }

      // ── Patch any remaining oklch/lab in inline <style> elements ──
      if (colorMap.size > 0) {
        clonedDoc.querySelectorAll('style').forEach(el => {
          let css = el.textContent || '';
          let changed = false;
          for (const [fn, rgb] of colorMap) {
            if (css.includes(fn)) {
              css = css.split(fn).join(rgb);
              changed = true;
            }
          }
          if (changed) el.textContent = css;
        });

        // ── Patch inline style attributes ──
        clonedDoc.querySelectorAll('[style]').forEach(el => {
          const htmlEl = el as HTMLElement;
          let style = htmlEl.getAttribute('style') || '';
          let changed = false;
          for (const [fn, rgb] of colorMap) {
            if (style.includes(fn)) {
              style = style.split(fn).join(rgb);
              changed = true;
            }
          }
          if (changed) htmlEl.setAttribute('style', style);
        });
      }

      // ── Fix -webkit-background-clip: text ──
      // html2canvas cannot render background-clip:text — replace with solid colour
      clonedDoc.querySelectorAll('[style]').forEach(el => {
        const htmlEl = el as HTMLElement;
        const s = htmlEl.getAttribute('style') || '';
        if (s.includes('-webkit-background-clip') || s.includes('background-clip: text')) {
          const gradientMatch = s.match(
            /(?:linear-gradient|radial-gradient)\([^,]*,\s*([#\w]+)/
          );
          const fallback = gradientMatch ? gradientMatch[1].trim() : '#facc15';
          htmlEl.style.backgroundImage = 'none';
          htmlEl.style.color = fallback;
          htmlEl.style.setProperty('-webkit-background-clip', 'border-box');
          htmlEl.style.setProperty('-webkit-text-fill-color', fallback);
          htmlEl.style.setProperty('background-clip', 'border-box');
        }
      });

      // ── Fix Recharts ResponsiveContainer negative-size warning ──
      // In the clone doc the container may temporarily report -1×-1.
      // Give .recharts-responsive-container a min-size so it doesn't complain.
      clonedDoc.querySelectorAll('.recharts-responsive-container').forEach(el => {
        const htmlEl = el as HTMLElement;
        const w = htmlEl.style.width;
        const h = htmlEl.style.height;
        if (!w || w === '100%') htmlEl.style.minWidth = '300px';
        if (!h || h === '100%') htmlEl.style.minHeight = '200px';
      });
    },
  });

  return canvas.toDataURL('image/png');
}
