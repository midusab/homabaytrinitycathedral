const fs = require('fs');
const path = require('path');

const replacementMap = {
  'rounded-\\[64px\\]': 'rounded-[48px]',
  'rounded-\\[48px\\]': 'rounded-[32px]',
  'rounded-\\[40px\\]': 'rounded-[28px]',
  'rounded-\\[32px\\]': 'rounded-2xl',
  'rounded-3xl': 'rounded-2xl',
  'rounded-\\[28px\\]': 'rounded-xl',
  'rounded-\\[24px\\]': 'rounded-xl',
  'rounded-2xl': 'rounded-lg',
  'rounded-xl': 'rounded-md',
  'rounded-lg': 'rounded-md',
};

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Perform replacements sequentially with an intermediate token to avoid double replacements
      const tempMap = {};
      let i = 0;
      
      for (const [key, value] of Object.entries(replacementMap)) {
        const token = `__TMP_TOKEN_${i}__`;
        tempMap[token] = value;
        content = content.replace(new RegExp(key, 'g'), token);
        i++;
      }
      
      for (const [token, value] of Object.entries(tempMap)) {
        content = content.replace(new RegExp(token, 'g'), value);
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

// Start in the src directory
processDirectory(path.join(process.cwd(), 'src'));
console.log('Border radiuses reduced globally!');
