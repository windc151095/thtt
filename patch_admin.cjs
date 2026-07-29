const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const stateRegex = /const \[drafts, setDrafts\] = useState<\{ pin: string; timestamp: number; data: FormData \}\[\]>\(\[\]\);/;
const stateInsert = `  const [drafts, setDrafts] = useState<{ pin: string; timestamp: number; data: FormData }[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; senderName: string; content?: string; timestamp: number }[]>([]);
  const [activeMembers, setActiveMembers] = useState<{ name: string; messageCount: number }[]>([]);
`;
code = code.replace(stateRegex, stateInsert);

const loadDraftsRegex = /const loadDrafts = async \(\) => \{/;
const loadChatMessagesInsert = `
  const loadChatMessages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'chat_messages'));
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      msgs.sort((a, b) => b.timestamp - a.timestamp);
      setChatMessages(msgs);
      
      const memberMap = new Map<string, number>();
      msgs.forEach(msg => {
        const count = memberMap.get(msg.senderName) || 0;
        memberMap.set(msg.senderName, count + 1);
      });
      setActiveMembers(Array.from(memberMap.entries()).map(([name, messageCount]) => ({ name, messageCount })));
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
    }
  };

  const loadDrafts = async () => {`;
code = code.replace(loadDraftsRegex, loadChatMessagesInsert);

const useEffectRegex = /loadDrafts\(\);\n      const interval = setInterval\(loadDrafts, 15000\);/
const useEffectInsert = `loadDrafts();
      loadChatMessages();
      const interval = setInterval(() => { loadDrafts(); loadChatMessages(); }, 15000);`;
code = code.replace(useEffectRegex, useEffectInsert);

const methodsRegex = /const deleteDraft = async \(pin: string\) => \{/;
const methodsInsert = `
  const deleteAllChatMessages = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả tin nhắn chat không? Hành động này không thể hoàn tác.')) {
      try {
        const querySnapshot = await getDocs(collection(db, 'chat_messages'));
        const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'chat_messages', docSnap.id)));
        await Promise.all(deletePromises);
        loadChatMessages();
      } catch (error) {
        console.error('Lỗi khi xóa chat:', error);
        alert('Có lỗi xảy ra khi xóa tin nhắn.');
      }
    }
  };

  const deleteMemberMessages = async (memberName: string) => {
    if (window.confirm(\`Bạn có chắc muốn xóa tất cả tin nhắn của thành viên "\${memberName}"?\`)) {
      try {
        const querySnapshot = await getDocs(collection(db, 'chat_messages'));
        const deletePromises = querySnapshot.docs
          .filter(docSnap => docSnap.data().senderName === memberName)
          .map(docSnap => deleteDoc(doc(db, 'chat_messages', docSnap.id)));
        await Promise.all(deletePromises);
        loadChatMessages();
      } catch (error) {
        console.error('Lỗi khi xóa tin nhắn của thành viên:', error);
        alert('Có lỗi xảy ra khi xóa.');
      }
    }
  };

  const deleteDraft = async (pin: string) => {`;
code = code.replace(methodsRegex, methodsInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
