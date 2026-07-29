const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const tabsRegex = /<button\n\s*onClick=\{\(\) => setActiveTab\('fields'\)\}/;
const tabsInsert = `<button
          onClick={() => setActiveTab('chat')}
          className={\`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors \${
            activeTab === 'chat' ? 'bg-white text-[#5A5A40] border-t-2 border-t-[#5A5A40]' : 'text-gray-400 hover:text-gray-600'
          }\`}
        >
          <MessageCircle className="w-4 h-4" />
          Chat/Hỗ trợ
        </button>
        <button
          onClick={() => setActiveTab('fields')}`;
code = code.replace(tabsRegex, tabsInsert);

const chatPanelRegex = /\{activeTab === 'fields' && \(/;
const chatPanelInsert = `{activeTab === 'chat' && (
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-black text-[#5A5A40] uppercase tracking-widest">Quản lý Chat/Hỗ trợ</h3>
            <button
              onClick={deleteAllChatMessages}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả chat
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Thành viên đang trong chat ({activeMembers.length})</h4>
            {activeMembers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Không có thành viên nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMembers.map((member) => (
                  <div key={member.name} className="flex items-center justify-between p-4 bg-[#F9F9F7] border border-[#E2E2D8] rounded-lg">
                    <div>
                      <div className="font-bold text-[#3C3633]">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.messageCount} tin nhắn</div>
                    </div>
                    <button
                      onClick={() => deleteMemberMessages(member.name)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Xóa tất cả tin nhắn của người này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-4 mt-8">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tin nhắn gần đây ({chatMessages.length})</h4>
            <div className="bg-[#F9F9F7] border border-[#E2E2D8] rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#E2E2D8] sticky top-0">
                  <tr>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">Người gửi</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">Nội dung</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E2D8]">
                  {chatMessages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-sm text-gray-500 italic">Không có tin nhắn nào.</td>
                    </tr>
                  ) : (
                    chatMessages.slice(0, 50).map((msg) => (
                      <tr key={msg.id} className="hover:bg-white transition-colors">
                        <td className="p-3 text-xs font-semibold text-[#3C3633] whitespace-nowrap">{msg.senderName}</td>
                        <td className="p-3 text-xs text-gray-600 max-w-[300px] truncate">{msg.content || '(Ảnh đính kèm)'}</td>
                        <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(msg.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (`;
code = code.replace(chatPanelRegex, chatPanelInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
