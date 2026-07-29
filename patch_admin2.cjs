const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const methodsRegex = /const handleDeleteDraft = async \(pin: string\) => \{/;
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

  const handleDeleteDraft = async (pin: string) => {`;
code = code.replace(methodsRegex, methodsInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
