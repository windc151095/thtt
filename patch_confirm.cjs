const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add confirm state
const stateRegex = /const \[drafts, setDrafts\] = useState<\{ pin: string; timestamp: number; data: FormData \}\[\]>\(\[\]\);/;
const stateInsert = `  const [drafts, setDrafts] = useState<{ pin: string; timestamp: number; data: FormData }[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);`;
code = code.replace(stateRegex, stateInsert);

// Replace confirm usages
const deleteAllRegex = /if \(window\.confirm\('Bạn có chắc muốn xóa tất cả tin nhắn chat không\? Hành động này không thể hoàn tác\.'\)\) \{([\s\S]*?)\}\n  \};/m;
code = code.replace(deleteAllRegex, (match, p1) => {
  return `setConfirmAction({
      message: 'Bạn có chắc muốn xóa tất cả tin nhắn chat không? Hành động này không thể hoàn tác.',
      onConfirm: async () => {${p1}}
    });
  };`;
});

const deleteMemberRegex = /if \(window\.confirm\(\`Bạn có chắc muốn xóa tất cả tin nhắn của thành viên "\$\{memberName\}"\?\`\)\) \{([\s\S]*?)\}\n  \};/m;
code = code.replace(deleteMemberRegex, (match, p1) => {
  return `setConfirmAction({
      message: \`Bạn có chắc muốn xóa tất cả tin nhắn của thành viên "\${memberName}"?\`,
      onConfirm: async () => {${p1}}
    });
  };`;
});

const deleteDraftRegex = /if \(confirm\(\`Bạn có chắc muốn xóa bài viết có mã PIN \$\{pin\}\?\`\)\) \{([\s\S]*?)\}\n  \};/m;
code = code.replace(deleteDraftRegex, (match, p1) => {
  return `setConfirmAction({
      message: \`Bạn có chắc muốn xóa bài viết có mã PIN \${pin}?\`,
      onConfirm: async () => {${p1}}
    });
  };`;
});

// Add Modal UI at the end
const renderRegex = /return \(\n    <div className="max-w-4xl/;
const renderInsert = `return (
    <div className="max-w-4xl relative">
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Xác nhận</h3>
            <p className="text-gray-600 mb-6">{confirmAction.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors font-medium"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    <div className="max-w-4xl`;
code = code.replace(renderRegex, renderInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
