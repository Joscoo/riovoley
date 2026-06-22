const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/features/gamification/presentation/components/GamificationAdminPanel.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove FaChevronLeft and FaChevronRight
content = content.replace(/, FaChevronLeft, FaChevronRight/, '');

// 2. Remove unused total variable
content = content.replace(/const \{ pageItems, page, totalPages, setPage, total \} = usePagination\(filtered\);/g, 'const { pageItems, page, totalPages, setPage } = usePagination(filtered);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Lint warnings fixed successfully');
