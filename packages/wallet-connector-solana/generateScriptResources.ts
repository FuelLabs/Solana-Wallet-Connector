import fs from 'fs';
import { hexlify } from 'fuels';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const predicates = ['verification-script'];

let code = 'export const scripts = {\n';

predicates.forEach((predicate) => {
  const outputDirectory = `${__dirname}/../signature-verification/${predicate}/out/debug`;
  const abiPath = `${outputDirectory}/${predicate}-abi.json`;
  const bytecodePath = `${outputDirectory}/${predicate}.bin`;

  const abi = fs.readFileSync(abiPath, 'utf8');
  const bytecode = hexlify(fs.readFileSync(bytecodePath));

  code += `  '${predicate}': {\n`;
  code += `    abi: ${abi},\n`;
  code += `    bytecode: "${bytecode}"`;
  code += `  },\n}`;
});

fs.writeFileSync(`${__dirname}/src/resources/scriptResources.ts`, code);
console.log('Generated'); // eslint-disable-line no-console
