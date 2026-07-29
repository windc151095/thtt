const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const returnRegex = /return \(\n    <div className="bg-white rounded-2xl shadow-xl shadow-black\/5 flex flex-col border border-white\/50 w-full overflow-hidden mb-12">/;
const returnInsert = `return (
    <>
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
    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 flex flex-col border border-white/50 w-full overflow-hidden mb-12">`;
code = code.replace(returnRegex, returnInsert);

// Fix the trailing div
const endRegex = /        <\/div>\n      \)\}\n    <\/div>\n  \);\n\}/;
const endInsert = `        </div>\n      )}\n    </div>\n    </>\n  );\n}`;
code = code.replace(endRegex, endInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
