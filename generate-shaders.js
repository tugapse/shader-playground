const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const shaderDir = path.join(srcDir, 'assets/shaders');
const outputDir = path.join(srcDir, 'engine/shaders');
const outputFile = path.join(outputDir, 'shader-sources.ts');

function findFiles(dir, extensions) {
  let files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(findFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function generateShaderClass() {
  const fragFiles = findFiles(shaderDir, ['.frag']);
  const vertFiles = findFiles(shaderDir, ['.vert']);

  let fragContent = '';
  for (const file of fragFiles) {
    const varName = path.basename(file, '.frag').replace(/[^a-zA-Z0-9_]/g, '_');
    const webPath = path.relative(srcDir, file).split(path.sep).join('/');
    fragContent += `    ${varName}: '${webPath}',\n`;
  }

  let vertContent = '';
  for (const file of vertFiles) {
    const varName = path.basename(file, '.vert').replace(/[^a-zA-Z0-9_]/g, '_');
    const webPath = path.relative(srcDir, file).split(path.sep).join('/');
    vertContent += `    ${varName}: '${webPath}',\n`;
  }

  const classContent = `/* eslint-disable */
// @ts-nocheck
export class ShaderSources {
  public static readonly frag = {
${fragContent.trimEnd()}
  };
  public static readonly vertex = {
${vertContent.trimEnd()}
  };
}
`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, classContent);
  console.log(`ShaderSources class generated at ${outputFile}`);
}

generateShaderClass();