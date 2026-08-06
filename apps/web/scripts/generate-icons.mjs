// Generates React components from the kit's SVGs in `design/icons/`.
//
// Why a script and not SVGR: the source SVGs hardcode `black` on every stroke
// and fill, so they cannot take the white treatment the active sidebar pill
// needs. The transform below rewrites those to `currentColor`, which SVGR does
// not do without a bespoke svgo plugin — and wiring SVGR into Next 15 means
// maintaining the loader twice, once for webpack and once for Turbopack.
// Running this once and committing the output avoids both problems and keeps
// the icons tree-shakeable with no build-time dependency.
//
// Re-run with: npm run icons:generate -w @dealport/web

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = resolve(here, "../../../design/icons");
const OUT_DIR = resolve(here, "../src/components/icons/generated");

/** `home-outline` -> `HomeOutlineIcon` */
function toComponentName(slug) {
  const pascal = slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  // A couple of the kit's files already end in "Icon"; don't double it up.
  return pascal.endsWith("Icon") ? pascal : `${pascal}Icon`;
}

/**
 * Rewrites the SVG body so the icon inherits colour from its container.
 * `fill="none"` is left alone — it is structural (outline icons rely on it),
 * not a colour choice.
 */
function normalizeColors(svg) {
  return svg
    .replace(/(stroke|fill)="(black|#000|#000000)"/gi, '$1="currentColor"')
    .replace(/(stroke|fill)="rgba?\(0,\s*0,\s*0[^)]*\)"/gi, '$1="currentColor"');
}

/** Pulls the root <svg …> attributes apart from its children. */
function splitSvg(svg) {
  const match = svg.match(/<svg([^>]*)>([\s\S]*)<\/svg>/i);
  if (!match) return null;
  return { attrs: match[1], body: match[2].trim() };
}

function getAttr(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? match[1] : null;
}

/** SVG attributes are kebab-case in markup but camelCase in JSX. */
function toJsxAttributes(body) {
  return body.replace(
    /\s([a-z]+(?:-[a-z]+)+)=/g,
    (_full, name) =>
      ` ${name.replace(/-([a-z])/g, (_m, c) => c.toUpperCase())}=`,
  );
}

const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith(".svg"));
files.sort();

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const exports = [];

for (const file of files) {
  const slug = file.replace(/\.svg$/, "");
  const componentName = toComponentName(slug);

  const raw = await readFile(join(SOURCE_DIR, file), "utf8");
  const parts = splitSvg(raw);
  if (!parts) {
    throw new Error(`Could not parse ${file} — no <svg> root element found.`);
  }

  // Size is dropped from the markup so it comes from the `size-*` utility at
  // the call site; viewBox is what actually preserves the geometry.
  const viewBox =
    getAttr(parts.attrs, "viewBox") ??
    `0 0 ${getAttr(parts.attrs, "width") ?? 20} ${getAttr(parts.attrs, "height") ?? 20}`;

  const body = toJsxAttributes(normalizeColors(parts.body))
    .split("\n")
    .map((line) => (line.trim() ? `      ${line.trim()}` : ""))
    .join("\n");

  const source = `// Generated from design/icons/${file} — do not edit by hand.
// Run \`npm run icons:generate -w @dealport/web\` to regenerate.
import type { SVGProps } from "react";

export function ${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
${body}
    </svg>
  );
}
`;

  await writeFile(join(OUT_DIR, `${slug}.tsx`), source, "utf8");
  exports.push({ componentName, slug });
}

const index = `// Generated — do not edit by hand.
// Run \`npm run icons:generate -w @dealport/web\` to regenerate.
${exports.map((e) => `export { ${e.componentName} } from "./${e.slug}";`).join("\n")}
`;

await writeFile(join(OUT_DIR, "index.ts"), index, "utf8");

console.log(`Generated ${exports.length} icon components in ${OUT_DIR}`);
