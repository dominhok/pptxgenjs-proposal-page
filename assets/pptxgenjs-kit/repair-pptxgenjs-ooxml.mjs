import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error("사용법: node repair-pptxgenjs-ooxml.mjs <pptx 파일>");
}

const absolutePath = path.resolve(sourcePath);
const temporaryPath = `${absolutePath}.repairing`;
const backupPath = `${absolutePath}.before-notes-repair`;
const zip = await JSZip.loadAsync(await fs.readFile(absolutePath));

function removeByPrefix(prefix) {
  for (const entryName of Object.keys(zip.files)) {
    if (entryName.startsWith(prefix)) zip.remove(entryName);
  }
}

async function replaceXml(entryName, transform) {
  const entry = zip.file(entryName);
  if (!entry) return;
  const original = await entry.async("string");
  const transformed = transform(original);
  if (transformed !== original) zip.file(entryName, transformed);
}

// PptxGenJS 4.0.1 adds unused notes infrastructure whose element order fails
// strict Office Open XML validation. Remove only that infrastructure. Slide
// content, themes, shapes, media, and ordinary relationships remain untouched.
removeByPrefix("ppt/notesMasters/");
removeByPrefix("ppt/notesSlides/");

await replaceXml("[Content_Types].xml", (xml) =>
  xml.replace(
    /<Override\b[^>]*PartName="\/ppt\/notes(?:Masters|Slides)\/[^\"]+"[^>]*\/>/g,
    "",
  ),
);

await replaceXml("ppt/presentation.xml", (xml) =>
  xml.replace(/<p:notesMasterIdLst\b[\s\S]*?<\/p:notesMasterIdLst>/g, ""),
);

await replaceXml("ppt/_rels/presentation.xml.rels", (xml) =>
  xml.replace(
    /<Relationship\b(?=[^>]*\bType="[^"]*\/notesMaster")[^>]*\/>/g,
    "",
  ),
);

for (const entryName of Object.keys(zip.files)) {
  if (/^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(entryName)) {
    await replaceXml(entryName, (xml) =>
      xml.replace(
        /<Relationship\b(?=[^>]*\bType="[^"]*\/notesSlide")[^>]*\/>/g,
        "",
      ),
    );
  }
}

const repaired = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});

await fs.writeFile(temporaryPath, repaired);

try {
  await fs.rename(absolutePath, backupPath);
  await fs.rename(temporaryPath, absolutePath);
  await fs.unlink(backupPath);
} catch (error) {
  try {
    await fs.access(backupPath);
    await fs.rename(backupPath, absolutePath);
  } catch {
    // Preserve the original error; restoration is best effort.
  }
  throw error;
}

console.log(`PptxGenJS 노트 OOXML 정규화 완료: ${absolutePath}`);
