import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, XCircle, ChevronLeft, CheckCircle, Eye } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface SupportCase {
  id: string;
  studentName: string;
  status: 'pending' | 'processing' | 'completed';
  isPublic: boolean;
  publicTitle?: string;
  createdAt: number;
  supporterName?: string;
}

export interface SupportMessage {
  id?: string;
  caseId: string;
  senderName: string;
  senderRole: 'student' | 'supporter' | 'admin';
  content?: string;
  imageUrl?: string;
  timestamp: number;
}

export const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<'none' | 'supporter' | 'student'>('none');
  
  // Supporter states
  const [supporterCodeInput, setSupporterCodeInput] = useState('');
  const [supporterNameInput, setSupporterNameInput] = useState('');
  const [isSupporterAuth, setIsSupporterAuth] = useState(false);
  
  // Student states
  const [studentNameInput, setStudentNameInput] = useState('');
  const [isStudentAuth, setIsStudentAuth] = useState(false);
  
  // Cases states
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<SupportCase | null>(null);
  const [allCases, setAllCases] = useState<SupportCase[]>([]);
  const [publicCases, setPublicCases] = useState<SupportCase[]>([]);
  
  // Messages states
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPublicTitlePrompt, setShowPublicTitlePrompt] = useState(false);
  const [publicTitleInput, setPublicTitleInput] = useState('');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Restore session
    const savedRole = localStorage.getItem('chat_role') as 'supporter' | 'student' | null;
    if (savedRole === 'supporter') {
      const savedName = localStorage.getItem('chat_supporterName');
      if (savedName) {
        setRole('supporter');
        setSupporterNameInput(savedName);
        setIsSupporterAuth(true);
      }
    } else if (savedRole === 'student') {
      const savedName = localStorage.getItem('chat_studentName');
      if (savedName) {
        setRole('student');
        setStudentNameInput(savedName);
        setIsStudentAuth(true);
      }
      const savedCaseId = localStorage.getItem('chat_activeCaseId');
      if (savedCaseId) {
        setActiveCaseId(savedCaseId);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Fetch cases for supporter
  useEffect(() => {
    if (role === 'supporter' && isSupporterAuth) {
      const q = query(collection(db, 'support_cases'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cases: SupportCase[] = [];
        snapshot.forEach((doc) => {
          cases.push({ id: doc.id, ...doc.data() } as SupportCase);
        });
        setAllCases(cases);
      });
      return () => unsubscribe();
    }
  }, [role, isSupporterAuth]);

  // Fetch public cases for student
  useEffect(() => {
    if (role === 'student' && !activeCaseId) {
      const q = query(collection(db, 'support_cases'), where('isPublic', '==', true), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cases: SupportCase[] = [];
        snapshot.forEach((doc) => {
          cases.push({ id: doc.id, ...doc.data() } as SupportCase);
        });
        setPublicCases(cases);
      });
      return () => unsubscribe();
    }
  }, [role, activeCaseId]);

  // Fetch active case details
  useEffect(() => {
    if (activeCaseId) {
      const unsubscribe = onSnapshot(doc(db, 'support_cases', activeCaseId), (docSnap) => {
        if (docSnap.exists()) {
          setActiveCase({ id: docSnap.id, ...docSnap.data() } as SupportCase);
        } else {
          setActiveCase(null);
          setActiveCaseId(null);
          localStorage.removeItem('chat_activeCaseId');
        }
      });
      return () => unsubscribe();
    } else {
      setActiveCase(null);
    }
  }, [activeCaseId]);

  // Fetch messages for active case
  useEffect(() => {
    if (activeCaseId) {
      const q = query(collection(db, 'support_messages'), where('caseId', '==', activeCaseId), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: SupportMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as SupportMessage);
        });
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [activeCaseId]);

    const handleSupporterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterCodeInput.trim()) {
      alert('Vui lòng nhập mã tiếp nhận hỗ trợ.');
      return;
    }
    
    try {
      const configDoc = await getDoc(doc(db, 'config', 'global'));
      if (configDoc.exists()) {
        const supporters = configDoc.data().supporters || [];
        const matched = supporters.find((s: any) => s.code === supporterCodeInput.trim());
        
        if (matched) {
          setSupporterNameInput(matched.name);
          setIsSupporterAuth(true);
          localStorage.setItem('chat_role', 'supporter');
          localStorage.setItem('chat_supporterName', matched.name);
        } else {
          alert('Mã tiếp nhận hỗ trợ không chính xác!');
        }
      } else {
        alert('Cấu hình chưa được khởi tạo.');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xác thực.');
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentNameInput.trim()) {
      setIsStudentAuth(true);
      localStorage.setItem('chat_role', 'student');
      localStorage.setItem('chat_studentName', studentNameInput.trim());
    }
  };

  const handleCreateCase = async () => {
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `CASE-${dd}${mm}`;
      
      const q = query(
        collection(db, 'support_cases'),
        where('id', '>=', prefix),
        where('id', '<=', prefix + '\\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      
      let maxSeq = 0;
      querySnapshot.forEach((doc) => {
        const idStr = doc.id;
        if (idStr.startsWith(prefix)) {
          const seqStr = idStr.substring(prefix.length);
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      });
      
      const nextSeq = String(maxSeq + 1).padStart(2, '0');
      const newCaseId = `${prefix}${nextSeq}`;

      const newCase: SupportCase = {
        id: newCaseId,
        studentName: studentNameInput.trim(),
        status: 'pending',
        isPublic: false,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'support_cases', newCaseId), newCase);
      setActiveCaseId(newCaseId);
      localStorage.setItem('chat_activeCaseId', newCaseId);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo case.');
    }
  };

  const handleProcessCase = async (caseId: string) => {
    try {
      await updateDoc(doc(db, 'support_cases', caseId), {
        status: 'processing',
        supporterName: supporterNameInput.trim()
      });
      setActiveCaseId(caseId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseCaseTemporary = () => {
    setActiveCaseId(null);
  };

  const handleCompleteCase = async () => {
    if (!activeCaseId) return;
    if (true) {
      try {
        await updateDoc(doc(db, 'support_cases', activeCaseId), {
          status: 'completed',
          isPublic: false
        });
        setActiveCaseId(null);
      } catch (error) {
        console.error(error);
        alert('Lỗi: ' + (error as any).message);
      }
    }
  };

  const handleCompleteAndPublicCase = async () => {
    if (!activeCaseId) return;
    setShowPublicTitlePrompt(true);
    setPublicTitleInput('');
  };

  const submitPublicCase = async () => {
    if (!activeCaseId) return;
    try {
      await updateDoc(doc(db, 'support_cases', activeCaseId), {
        status: 'completed',
        isPublic: true,
        publicTitle: publicTitleInput.trim() || activeCaseId
      });
      setShowPublicTitlePrompt(false);
      setActiveCaseId(null);
    } catch (error) {
      console.error(error);
      alert('Lỗi: ' + (error as any).message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !activeCaseId) return;

    const senderName = role === 'supporter' ? supporterNameInput : studentNameInput;
    
    const msg: any = {
      caseId: activeCaseId,
      senderName,
      senderRole: role,
      timestamp: Date.now(),
    };

    if (newMessage.trim()) {
      msg.content = newMessage.trim();
    }

    if (selectedImage) {
      msg.imageUrl = selectedImage;
    }

    try {
      await addDoc(collection(db, 'support_messages'), msg);
      setNewMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_role');
    localStorage.removeItem('chat_supporterName');
    localStorage.removeItem('chat_studentName');
    localStorage.removeItem('chat_activeCaseId');
    setRole('none');
    setIsSupporterAuth(false);
    setIsStudentAuth(false);
    setActiveCaseId(null);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#3C3633] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5A5A40] transition-transform hover:scale-105 z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-[#E2E2D8]">
          {/* Header */}
          <div className="p-4 bg-[#3C3633] text-white flex flex-col justify-between items-start">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {activeCaseId && (
                  <button onClick={() => setActiveCaseId(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-bold text-sm">Hỗ trợ & Tương tác</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {(role !== 'none') && (
              <div className="w-full flex justify-between items-center text-[10px]">
                <span className="opacity-80">Vai trò: {role === 'supporter' ? 'Người trợ lực' : 'Học viên'}</span>
                <button onClick={handleLogout} className="underline hover:text-red-300">Đăng xuất</button>
              </div>
            )}
            {activeCase && (
               <div className="w-full text-xs mt-1 py-1 px-2 bg-white/10 rounded font-semibold flex justify-between">
                 <span>Case: {activeCase.id}</span>
                 <span className={activeCase.status === 'completed' ? 'text-green-300' : (activeCase.status === 'processing' ? 'text-yellow-300' : 'text-gray-300')}>
                   {activeCase.status === 'pending' ? 'Chờ xử lý' : (activeCase.status === 'processing' ? 'Đang xử lý' : 'Đã hoàn thành')}
                 </span>
               </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-[#F9F9F7] relative flex flex-col">
            {role === 'none' && (
              <div className="p-6 flex flex-col items-center justify-center h-full space-y-6">
                <p className="text-gray-600 font-medium">Bạn là người...</p>
                <button
                  onClick={() => setRole('supporter')}
                  className="w-full py-3 bg-[#5A5A40] text-white rounded-lg font-bold hover:bg-[#4A4A35] transition-colors"
                >
                  Người trợ lực
                </button>
                <button
                  onClick={() => setRole('student')}
                  className="w-full py-3 bg-[#8B8B7A] text-white rounded-lg font-bold hover:bg-[#7A7A6A] transition-colors"
                >
                  Học viên Sống Sáng Suốt
                </button>
              </div>
            )}

            {role === 'supporter' && !isSupporterAuth && (
              <form onSubmit={handleSupporterLogin} className="p-6 flex flex-col justify-center h-full space-y-4">
                <h4 className="font-bold text-center text-[#3C3633]">Xác thực Người trợ lực</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mã tiếp nhận hỗ trợ</label>
                  <input
                    type="text"
                    value={supporterCodeInput}
                    onChange={(e) => setSupporterCodeInput(e.target.value)}
                    className="w-full p-3 border border-[#E2E2D8] rounded-lg focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Nhập mã do quản trị viên cấp"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#3C3633] text-white rounded-lg font-bold hover:bg-[#2A2523] transition-colors mt-4"
                >
                  Xác nhận
                </button>
              </form>
            )}

            {role === 'student' && !isStudentAuth && (
              <form onSubmit={handleStudentLogin} className="p-6 flex flex-col justify-center h-full space-y-4">
                <h4 className="font-bold text-center text-[#3C3633]">Bắt đầu hỗ trợ</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tên của bạn</label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    className="w-full p-3 border border-[#E2E2D8] rounded-lg focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Nhập tên của bạn"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#3C3633] text-white rounded-lg font-bold hover:bg-[#2A2523] transition-colors mt-4"
                >
                  Tiếp tục
                </button>
              </form>
            )}

            {/* List Cases for Supporter */}
            {role === 'supporter' && isSupporterAuth && !activeCaseId && (
              <div className="p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Các yêu cầu hỗ trợ</h4>
                {allCases.filter(c => c.status === 'pending' || ((c.status === 'processing' || c.status === 'completed') && c.supporterName === supporterNameInput)).length === 0 ? (
                  <p className="text-center text-sm text-gray-500 italic py-8">Không có case hỗ trợ nào đang chờ.</p>
                ) : (
                  allCases.filter(c => c.status === 'pending' || ((c.status === 'processing' || c.status === 'completed') && c.supporterName === supporterNameInput)).map(c => (
                    <div key={c.id} className="bg-white border border-[#E2E2D8] p-4 rounded-lg shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-sm text-[#3C3633] mb-1">{c.publicTitle || c.id}</p>
                          <p className="text-[10px] text-gray-500 mb-1">Mã: {c.id}</p>
                          <p className="text-xs text-gray-500">Học viên: {c.studentName}</p>
                          <p className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${c.status === 'pending' ? 'bg-red-100 text-red-600' : (c.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : (c.status === 'completed' && c.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'))}`}>
                          {c.status === 'pending' ? 'Chờ' : (c.status === 'processing' ? 'Đang xử lý' : (c.status === 'completed' && c.isPublic ? 'Công khai' : 'Kết thúc'))}
                        </span>
                      </div>
                      {c.status === 'pending' ? (
                        <button onClick={() => handleProcessCase(c.id)} className="w-full py-2 bg-[#5A5A40] text-white text-xs font-bold rounded hover:bg-[#4A4A35]">
                          Tiếp nhận & Xử lý
                        </button>
                      ) : (
                        <button onClick={() => setActiveCaseId(c.id)} className="w-full py-2 border border-[#E2E2D8] text-gray-700 text-xs font-bold rounded hover:bg-gray-50">
                          {c.status === 'processing' ? 'Tiếp tục xử lý' : 'Xem lại'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Dashboard for Student */}
            {role === 'student' && isStudentAuth && !activeCaseId && (
              <div className="p-4 flex flex-col h-full">
                <button
                  onClick={handleCreateCase}
                  className="w-full py-4 bg-[#3C3633] text-white rounded-lg font-bold shadow-md hover:bg-[#2A2523] transition-colors mb-6 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Bắt đầu case hỗ trợ mới
                </button>
                
                <div className="flex-1 overflow-y-auto">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Case hỗ trợ cộng đồng
                  </h4>
                  {publicCases.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 italic py-8">Chưa có case nào được công khai.</p>
                  ) : (
                    <div className="space-y-3">
                      {publicCases.map(c => (
                        <div key={c.id} onClick={() => setActiveCaseId(c.id)} className="bg-white border border-[#E2E2D8] p-3 rounded-lg shadow-sm cursor-pointer hover:border-[#5A5A40] transition-colors">
                          <p className="font-bold text-sm text-[#3C3633] mb-1">{c.publicTitle || c.id}</p>
                          <p className="text-[10px] text-gray-500 mb-1">Mã: {c.id}</p>
                          <p className="text-xs text-gray-600">Trợ lực viên: <span className="font-semibold">{c.supporterName}</span></p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat View */}
            {activeCaseId && activeCase && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 italic py-8">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = (role === 'supporter' && msg.senderRole === 'supporter' && msg.senderName === supporterNameInput) || 
                                 (role === 'student' && msg.senderRole === 'student' && msg.senderName === studentNameInput);
                    
                    return (
                      <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-500 mb-1 ml-1">
                          {msg.senderName} {msg.senderRole === 'supporter' ? '(Trợ lực viên)' : ''}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                            isMe
                              ? 'bg-[#5A5A40] text-white rounded-tr-sm'
                              : 'bg-white border border-[#E2E2D8] text-[#3C3633] rounded-tl-sm'
                          }`}
                        >
                          {msg.content && <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>}
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attached"
                              className="max-w-full rounded-lg mt-2 max-h-48 object-cover"
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          {activeCaseId && activeCase && (
            <div className="bg-white border-t border-[#E2E2D8] flex flex-col">
              {role === 'supporter' && activeCase.status !== 'completed' && (
                <div className="p-2 border-b border-[#E2E2D8] bg-[#F9F9F7] grid grid-cols-3 gap-2">
                  <button onClick={handleCloseCaseTemporary} className="w-full py-2 bg-gray-50 text-gray-700 text-[11px] font-bold rounded-lg border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
                    Đóng
                  </button>
                  <button onClick={handleCompleteCase} className="w-full py-2 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center justify-center">
                    Kết thúc
                  </button>
                  <button onClick={handleCompleteAndPublicCase} className="w-full py-2 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg border border-green-200 hover:bg-green-100 flex items-center justify-center">
                    Công khai
                  </button>
                </div>
              )}
              
              {showPublicTitlePrompt ? (
                <div className="p-4 bg-green-50 border-t border-green-200">
                  <h4 className="text-xs font-bold text-green-800 mb-2">Nhập tên case công khai</h4>
                  <input
                    type="text"
                    value={publicTitleInput}
                    onChange={(e) => setPublicTitleInput(e.target.value)}
                    placeholder="VD: Gặp khó khăn khi thực hành phá chấp..."
                    className="w-full p-2 border border-green-200 rounded text-sm mb-2 focus:outline-none focus:border-green-400"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowPublicTitlePrompt(false)} className="flex-1 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
                    <button onClick={submitPublicCase} className="flex-1 py-2 bg-green-600 rounded text-xs font-bold text-white hover:bg-green-700">Xác nhận công khai</button>
                  </div>
                </div>
              ) : (activeCase.status === 'completed' || (role === 'student' && activeCase.studentName !== studentNameInput)) ? (
                <div className="p-4 text-center text-sm text-gray-500 italic bg-[#F5F5F0]">
                  Case hỗ trợ này đã kết thúc hoặc ở chế độ chỉ xem.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-4">
                  {selectedImage && (
                    <div className="mb-3 relative inline-block">
                      <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-[#E2E2D8] shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-[#F9F9F7] border border-[#E2E2D8] rounded-2xl flex items-end p-1 shadow-inner focus-within:border-[#5A5A40] transition-colors">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-[#5A5A40] transition-colors shrink-0"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 max-h-32 min-h-[40px] bg-transparent p-2 text-sm focus:outline-none resize-none"
                        rows={1}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() && !selectedImage}
                      className="p-3 bg-[#5A5A40] text-white rounded-full hover:bg-[#4A4A35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
