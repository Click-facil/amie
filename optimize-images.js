const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = process.cwd();
const keepOriginals = process.argv.includes('--keep-originals');
const imageMap = {
  '1.jpeg': 'hero-01.webp',
  '2.jpeg': 'hero-02.webp',
  '3.jpeg': 'hero-03.webp',
  'foto01.jpeg': 'sobre-01.webp',
  'peca-01.jpeg': 'look-01.webp',
  'peca-02.jpeg': 'look-02.webp',
  'peca-03.jpeg': 'look-03.webp',
  'peca-04.jpeg': 'look-04.webp',
  'amie-baby-logo.png': 'amie-logo.webp'
};
const sourceFiles = Object.keys(imageMap);
const textFiles = ['index.html', 'style.css', 'script.js'];

async function convertImage(sourceName, outputName) {
  const originalPath = path.join(root, sourceName);
  const outputPath = path.join(root, outputName);
  let sourcePath = originalPath;

  try {
    await fs.access(originalPath);
  } catch {
    return false;
  }

  const maxWidth = sourceName.includes('logo') ? 1200 : 1600;

  await sharp(sourcePath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(outputPath);

  if (!keepOriginals) {
    await fs.unlink(sourcePath);
  }
  return true;
}

async function updateReferences() {
  for (const fileName of textFiles) {
    const filePath = path.join(root, fileName);
    let content;

    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    const replacements = Object.entries(imageMap).sort(([left], [right]) => right.length - left.length);
    for (const [sourceName, outputName] of replacements) {
      content = content.replaceAll(sourceName, outputName);
    }

    await fs.writeFile(filePath, content, 'utf8');
  }
}

async function main() {
  let converted = 0;

  for (const sourceName of sourceFiles) {
    if (await convertImage(sourceName, imageMap[sourceName])) converted += 1;
  }

  if (converted === 0) {
    console.log('Nenhuma imagem original encontrada. Nada foi alterado.');
    return;
  }

  await updateReferences();
  console.log(`${converted} imagem(ns) convertida(s) para WebP.`);
  console.log(`Originais ${keepOriginals ? 'preservados' : 'removidos após a conversão'}.`);
}

main().catch((error) => {
  console.error('Falha ao otimizar imagens:', error.message);
  process.exitCode = 1;
});
