const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const tabsContainerRegex = /<div className="flex border-b border-\[#E2E2D8\] bg-\[#F5F5F0\]">/;
const tabsContainerInsert = \`<div className="flex overflow-x-auto border-b border-[#E2E2D8] bg-[#F5F5F0] hide-scrollbar">\`;
code = code.replace(tabsContainerRegex, tabsContainerInsert);

const buttonClassRegex = /className={\`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors \$\{/g;
const buttonClassInsert = \`className={\`flex-1 min-w-[140px] px-2 py-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap \${\`;
code = code.replace(buttonClassRegex, buttonClassInsert);

const logoutButtonRegex = /className="px-6 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-l border-\[#E2E2D8\]"/;
const logoutButtonInsert = \`className="px-4 py-4 flex shrink-0 items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-l border-[#E2E2D8]"\`;
code = code.replace(logoutButtonRegex, logoutButtonInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
