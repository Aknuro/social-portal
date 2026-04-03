const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const frontendSrcPath = path.join(__dirname, 'src');

walkDir(frontendSrcPath, (filePath) => {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  if (filePath.includes('api.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace import axios from 'axios'; with import api from '../services/api'; (or appropriate relative path)
  if (content.includes("import axios from 'axios';")) {
    const depth = filePath.replace(frontendSrcPath, '').split(path.sep).length - 2;
    const dots = depth > 0 ? '../'.repeat(depth) : './';
    const apiImportPath = `${dots}services/api`;
    
    content = content.replace(/import axios from 'axios';/g, `import api from '${apiImportPath}';`);
    
    // Replace axios.[method]('/api/...
    content = content.replace(/axios\.(get|post|put|delete|patch)\(['"`]\/api(.*?)(['"`])/g, "api.$1('$2'");
    content = content.replace(/axios\.delete\(/g, "api.delete(");
    content = content.replace(/axios\.put\(/g, "api.put(");
    content = content.replace(/axios\.post\(/g, "api.post(");
    content = content.replace(/axios\.get\(/g, "api.get(");

    // Some places might have used axios( ... ) without methods, but we'll try just the above first.
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});
