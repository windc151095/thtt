import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, XCircle } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface ChatMessage {
  id?: string;
  senderName: string;
  content?: string;
  imageUrl?: string;
  timestamp: number;
}

export const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    const savedName = localStorage.getItem('chat_senderName');
    if (savedName) {
      setSenderName(savedName);
      setIsNameEntered(true);
    }
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);

      if (!isInitialLoad.current && !isOpenRef.current) {
        const addedCount = snapshot.docChanges().filter(change => change.type === 'added').length;
        if (addedCount > 0) {
          setUnreadCount(prev => prev + addedCount);
        }
      }
      
      isInitialLoad.current = false;

      if (isOpenRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senderName.trim()) {
      localStorage.setItem('chat_senderName', senderName.trim());
      setIsNameEntered(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const msg: any = {
      senderName,
      timestamp: Date.now(),
    };

    if (newMessage.trim()) {
      msg.content = newMessage.trim();
    }

    if (selectedImage) {
      msg.imageUrl = selectedImage;
    }

    setNewMessage('');
    setSelectedImage(null);

    try {
      await addDoc(collection(db, 'chat_messages'), msg);
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;

          if (width > height) {
            if (width > max_size) {
              height = Math.round(height * max_size / width);
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width = Math.round(width * max_size / height);
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            if (dataUrl.length > 1000000) {
              alert("Ảnh sau khi nén vẫn quá lớn, vui lòng chọn ảnh khác.");
            } else {
              setSelectedImage(dataUrl);
            }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#2B4B6F] text-white p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all z-50 flex items-center justify-center"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[360px] h-[500px] max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
      <div className="bg-[#2B4B6F] text-white p-4 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-lg">Hỗ trợ & Tương tác</h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-gray-300">
          <X size={20} />
        </button>
      </div>

      {!isNameEntered ? (
        <div className="flex-1 p-6 flex flex-col justify-center items-center bg-gray-50">
          <MessageCircle size={48} className="text-gray-400 mb-4" />
          <h4 className="font-semibold text-gray-700 mb-2">Bắt đầu trò chuyện</h4>
          <p className="text-sm text-gray-500 text-center mb-6">Nhập tên của bạn để tương tác và nhận hỗ trợ trong quá trình thực hành.</p>
          <form onSubmit={handleNameSubmit} className="w-full flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Nhập tên của bạn..." 
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2B4B6F]"
              required
            />
            <button type="submit" className="w-full bg-[#2B4B6F] text-white font-semibold p-3 rounded-lg hover:bg-opacity-90 transition-all">
              Bắt đầu
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Chưa có tin nhắn nào. Bắt đầu ngay!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderName === senderName;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName} • {formatTime(msg.timestamp)}</span>
                    <div className={`p-3 rounded-2xl ${isMe ? 'bg-[#2B4B6F] text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="attached" className="max-w-full rounded-lg mb-2 object-contain" />
                      )}
                      {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-3 shrink-0">
            {selectedImage && (
              <div className="mb-3 relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-300" />
                <button 
                  onClick={() => setSelectedImage(null)} 
                  className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-md flex items-center justify-center"
                >
                  <XCircle size={18} />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-[#2B4B6F] rounded-full hover:bg-gray-100 transition-colors shrink-0"
                title="Đính kèm ảnh"
              >
                <ImageIcon size={22} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-gray-100 border-none rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#2B4B6F]"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() && !selectedImage}
                className="p-2 text-white bg-[#2B4B6F] rounded-full disabled:opacity-50 hover:bg-opacity-90 transition-opacity shrink-0 flex items-center justify-center"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
