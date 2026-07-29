import React, { useState, useEffect } from 'react';
import { TemplateConfig, FormData } from '../types';
import { Settings, Database, Trash2, Eye, LogOut, MessageCircle, XCircle } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminPanelProps {
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
  onSave?: () => void;
  onViewDraft?: (data: FormData) => void;
}

interface ColorInputProps {
  label: string;
  name: keyof TemplateConfig;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorInput = ({ label, name, value, onChange }: ColorInputProps) => {
  // Ensure valid hex format for type="color" input
  const validHexValue = /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : '#000000';
  
  return (
  <div className="flex items-center justify-between py-3 border-b border-[#F5F5F0] last:border-0">
    <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{label}</label>
    <div className="flex items-center gap-3">
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="text-[10px] font-mono text-gray-500 uppercase w-20 text-right bg-transparent border-b border-gray-200 focus:border-gray-400 outline-none"
        placeholder="#000000"
      />
      <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-[#E2E2D8] shrink-0">
        <input
          type="color"
          name={name}
          value={validHexValue}
          onChange={onChange}
          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
        />
      </div>
    </div>
  </div>
)};

const CONFIGURABLE_FIELDS = [
  { key: 'tinhHuong', label: 'Tình huống' },
  { key: 'thucCanh', label: 'Thực cảnh' },
  { key: 'soiTinhXau', label: 'Soi tính xấu' },
  { key: 'xetDocHai', label: 'Xét độc hại' },
  { key: 'thayHauQua', label: 'Thấy hậu quả' },
  { key: 'nhinGoc', label: 'Nhìn gốc' },
  { key: 'chonTam', label: 'Chọn tâm' },
  { key: 'duongTinh', label: 'Dưỡng tính' },
  { key: 'phaChap', label: 'Phá chấp' },
  { key: 'dinhTam', label: 'Định tâm' },
  { key: 'phatTue', label: 'Phát tuệ' },
  { key: 'thanhNguoi', label: 'Thành người' },
];

export function AdminPanel({ config, onChange, onSave, onViewDraft }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'drafts' | 'fields' | 'chat'>('drafts');
      const [drafts, setDrafts] = useState<{ pin: string; timestamp: number; data: FormData }[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; senderName: string; content?: string; timestamp: number }[]>([]);
  const [activeMembers, setActiveMembers] = useState<{ name: string; messageCount: number }[]>([]);


  useEffect(() => {
    if (isAuthenticated) {
      loadDrafts();
      loadChatMessages();
      const interval = setInterval(() => { loadDrafts(); loadChatMessages(); }, 15000); // Sync drafts every 15 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  
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

  const loadDrafts = async () => {
    const localDrafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('draft_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.data) {
            localDrafts.push(item);
          }
        } catch (e) {
          console.error('Lỗi khi đọc draft:', e);
        }
      }
    }
    
    try {
      const querySnapshot = await getDocs(collection(db, 'drafts'));
      const apiDrafts = querySnapshot.docs.map(doc => doc.data());
      
      // Merge API drafts and local drafts, avoiding duplicates by PIN
      const draftMap = new Map();
      localDrafts.forEach(d => draftMap.set(d.pin, d));
      apiDrafts.forEach((d: any) => draftMap.set(d.pin, d));
      
      const allDrafts = Array.from(draftMap.values());
      allDrafts.sort((a, b) => b.timestamp - a.timestamp);
      setDrafts(allDrafts);
    } catch (e) {
      localDrafts.sort((a, b) => b.timestamp - a.timestamp);
      setDrafts(localDrafts);
    }
  };

  
  const deleteAllChatMessages = async () => {
    setConfirmAction({
      message: 'Bạn có chắc muốn xóa tất cả tin nhắn chat không? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'chat_messages'));
        const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'chat_messages', docSnap.id)));
        await Promise.all(deletePromises);
        
        // Kick all active members
        const kickPromises = activeMembers.map(member => setDoc(doc(db, 'chat_kicks', member.name), { timestamp: Date.now() }));
        kickPromises.push(setDoc(doc(db, 'chat_kicks', 'GLOBAL_KICK_ALL'), { timestamp: Date.now() }));
        await Promise.all(kickPromises);
        loadChatMessages();
      } catch (error) {
        console.error('Lỗi khi xóa chat:', error);
        alert('Có lỗi xảy ra khi xóa tin nhắn.');
      }
    }
    });
  };

  const deleteMemberMessages = async (memberName: string) => {
    setConfirmAction({
      message: `Bạn có chắc muốn xóa tất cả tin nhắn của thành viên "${memberName}"?`,
      onConfirm: async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'chat_messages'));
        const deletePromises = querySnapshot.docs
          .filter(docSnap => docSnap.data().senderName === memberName)
          .map(docSnap => deleteDoc(doc(db, 'chat_messages', docSnap.id)));
        await Promise.all(deletePromises);
        
        // Kick member
        await setDoc(doc(db, 'chat_kicks', memberName), { timestamp: Date.now() });
        
        loadChatMessages();
      } catch (error) {
        console.error('Lỗi khi xóa tin nhắn của thành viên:', error);
        alert('Có lỗi xảy ra khi xóa.');
      }
    }
    });
  };

  const handleDeleteDraft = async (pin: string) => {
    setConfirmAction({
      message: `Bạn có chắc muốn xóa bài viết có mã PIN ${pin}?`,
      onConfirm: async () => {
      localStorage.removeItem(`draft_${pin}`);
      try {
        await deleteDoc(doc(db, 'drafts', pin));
      } catch (e) {
        console.error('Lỗi khi xóa draft:', e);
      } finally {
        loadDrafts();
      }
    }
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'ssstamthuc') {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminAuthenticated', 'true');
      setError('');
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: name === 'fontSize' ? Number(value) : value,
    });
  };

  const handleFieldConfigChange = (fieldKey: string, type: 'text' | 'select', optionsStr: string) => {
    const newFieldsConfig = { ...(config.fieldsConfig || {}) };
    newFieldsConfig[fieldKey] = {
      type,
      options: optionsStr.split('\n').map(s => s.trim()).filter(Boolean)
    };
    onChange({ ...config, fieldsConfig: newFieldsConfig });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminAuthenticated');
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-black/5 flex flex-col border border-white/50 w-full overflow-hidden mb-12 p-8">
        <div className="text-center mb-6">
          <h2 className="font-serif italic text-2xl text-[#5A5A40] mb-2">Đăng nhập Quản trị</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Hệ thống quản lý nội dung</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
          {error && <div className="p-3 bg-red-50 text-red-500 text-xs text-center rounded">{error}</div>}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-[#E2E2D8] rounded bg-[#F9F9F7] text-sm text-[#3C3633] focus:border-[#7A8471] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-[#E2E2D8] rounded bg-[#F9F9F7] text-sm text-[#3C3633] focus:border-[#7A8471] outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-[#5A5A40] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#4A4A35] transition-colors mt-2"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
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
    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 flex flex-col border border-white/50 w-full overflow-hidden mb-12">
      <div className="flex flex-wrap md:flex-nowrap border-b border-[#E2E2D8] bg-[#F5F5F0]">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`flex-1 min-w-[120px] py-4 px-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'drafts' ? 'bg-white text-[#5A5A40] border-t-2 border-t-[#5A5A40]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Database className="w-4 h-4" />
          Bài viết
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[120px] py-4 px-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-white text-[#5A5A40] border-t-2 border-t-[#5A5A40]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Hiển thị
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[120px] py-4 px-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'chat' ? 'bg-white text-[#5A5A40] border-t-2 border-t-[#5A5A40]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={`flex-1 min-w-[120px] py-4 px-2 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'fields' ? 'bg-white text-[#5A5A40] border-t-2 border-t-[#5A5A40]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Trường nhập
        </button>
        <button
          onClick={handleLogout}
          className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors md:border-l border-[#E2E2D8]"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'drafts' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-black text-[#5A5A40] uppercase tracking-widest">Danh sách bài viết đã lưu</h3>
            <span className="text-xs text-gray-500 font-mono">{drafts.length} bài viết</span>
          </div>
          
          <div className="space-y-3">
            {drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có bài viết nào được lưu.</div>
            ) : (
              drafts.map((draft) => (
                <div key={draft.pin} className="flex items-center justify-between p-4 border border-[#E2E2D8] rounded-lg bg-[#F9F9F7]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-[#5A5A40]">PIN: {draft.pin}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(draft.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate max-w-[300px]">
                      {draft.data.tinhHuong || 'Chưa có tiêu đề tình huống'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDraft && onViewDraft(draft.data)}
                      className="p-2 text-[#7A8471] hover:bg-[#E2E2D8] rounded transition-colors"
                      title="Xem/Sửa bài viết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.pin)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded transition-colors"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest mb-4">Logo</h3>
            <div className="pl-4 border-l border-[#E2E2D8] ml-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tải ảnh Logo lên</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 512;
                            const MAX_HEIGHT = 512;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.clearRect(0, 0, width, height);
                            ctx?.drawImage(img, 0, 0, width, height);
                            const dataUrl = canvas.toDataURL('image/png');
                            onChange({ ...config, logoUrl: dataUrl });
                          };
                          img.src = reader.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-[#F5F5F0] file:text-[#5A5A40] hover:file:bg-[#E2E2D8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Hoặc dán URL Logo</label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={config.logoUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full p-2 border border-[#E2E2D8] rounded bg-[#F9F9F7] text-xs text-[#3C3633] focus:border-[#7A8471] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest mb-4">Hình ảnh Hướng dẫn</h3>
            
            <div className="space-y-4 pl-4 border-l border-[#E2E2D8] ml-2">
              <div className="flex gap-4 items-start">
                {config.guideImageUrl && (
                  <img src={config.guideImageUrl} alt="Guide preview" className="w-16 h-16 object-contain rounded border border-[#E2E2D8] bg-[#F9F9F7]" />
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tải ảnh lên</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new window.Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 1024;
                              const MAX_HEIGHT = 1024;
                              let width = img.width;
                              let height = img.height;

                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.clearRect(0, 0, width, height);
                              
                              // Fill background with white in case of transparent PNG to JPEG conversion
                              if (ctx) {
                                ctx.fillStyle = '#FFFFFF';
                                ctx.fillRect(0, 0, width, height);
                              }
                              
                              ctx?.drawImage(img, 0, 0, width, height);
                              // Use JPEG with 0.7 quality to reduce base64 size for Firestore
                              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              onChange({ ...config, guideImageUrl: dataUrl });
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-[#F5F5F0] file:text-[#5A5A40] hover:file:bg-[#E2E2D8] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Hoặc dán URL Ảnh</label>
                    <input
                      type="text"
                      name="guideImageUrl"
                      value={config.guideImageUrl || ''}
                      onChange={handleChange}
                      placeholder="https://example.com/guide.png"
                      className="w-full p-2 border border-[#E2E2D8] rounded bg-[#F9F9F7] text-xs text-[#3C3633] focus:border-[#7A8471] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-[#7A8471] uppercase tracking-widest mb-4">Kiểu chữ & Kích thước</h3>
            
            <div className="space-y-4 pl-4 border-l border-[#E2E2D8] ml-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Cỡ chữ nhập liệu</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="fontSize"
                    value={config.fontSize}
                    onChange={handleChange}
                    min={8}
                    max={24}
                    className="flex-1 accent-[#7A8471]"
                  />
                  <span className="text-xs font-mono text-[#5A5A40] bg-[#F9F9F7] px-2 py-1 rounded border border-[#E2E2D8]">{config.fontSize}px</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Font chữ</label>
                <select
                  name="fontFamily"
                  value={config.fontFamily}
                  onChange={handleChange}
                  className="w-full p-2 border border-[#E2E2D8] rounded bg-[#F9F9F7] text-xs text-[#3C3633] focus:border-[#7A8471] outline-none transition-colors"
                >
                  <option value="'Google Sans', 'Be Vietnam Pro', 'Inter', sans-serif">Google Sans</option>
                  <option value="'Be Vietnam Pro', 'Inter', sans-serif">Be Vietnam Pro (Sans-serif)</option>
                  <option value="'Inter', sans-serif">Inter (Sans-serif)</option>
                  <option value="'Cormorant Garamond', serif">Cormorant Garamond (Serif)</option>
                  <option value="system-ui, -apple-system, sans-serif">System Default</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-[#9A8C73] uppercase tracking-widest mb-4">Màu sắc văn bản</h3>
            <div className="pl-4 border-l border-[#E2E2D8] ml-2">
              <ColorInput label="Màu chữ nội dung" name="textColor" value={config.textColor || ''} onChange={handleChange} />
              <ColorInput label="Màu Tiêu đề chính" name="headingColor1" value={config.headingColor1 || ''} onChange={handleChange} />
              <ColorInput label="Màu Tiêu đề phụ" name="headingColor2" value={config.headingColor2 || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-[#5A5A40] uppercase tracking-widest mb-4">Màu nền & Màu khung</h3>
            <div className="pl-4 border-l border-[#E2E2D8] ml-2">
              <ColorInput label="Màu nền" name="backgroundColor" value={config.backgroundColor || ''} onChange={handleChange} />
              <ColorInput label="Viền cột trái" name="borderColor1" value={config.borderColor1 || ''} onChange={handleChange} />
              <ColorInput label="Viền cột phải" name="borderColor2" value={config.borderColor2 || ''} onChange={handleChange} />
              <ColorInput label="Viền bảng dưới" name="borderColor3" value={config.borderColor3 || ''} onChange={handleChange} />
            </div>
          </div>
          
          {onSave && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={onSave}
                className="px-6 py-2 bg-[#5A5A40] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#4A4A35] transition-colors"
              >
                Lưu tùy chọn
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
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

      {activeTab === 'fields' && (
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-black text-[#5A5A40] uppercase tracking-widest">Cấu hình trường nhập liệu</h3>
          </div>
          
          <div className="space-y-6">
            {CONFIGURABLE_FIELDS.map((field) => {
              const currentConfig = config.fieldsConfig?.[field.key] || { type: 'text', options: [] };
              
              return (
                <div key={field.key} className="p-4 border border-[#E2E2D8] rounded-lg bg-[#F9F9F7]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-bold text-[#5A5A40]">{field.label}</span>
                    <select
                      value={currentConfig.type}
                      onChange={(e) => handleFieldConfigChange(field.key, e.target.value as 'text' | 'select', (currentConfig.options || []).join('\n'))}
                      className="p-1 border border-[#E2E2D8] rounded bg-white text-[10px] uppercase font-bold text-[#5A5A40] outline-none"
                    >
                      <option value="text">Văn bản (Textarea)</option>
                      <option value="select">Lựa chọn (Select)</option>
                    </select>
                  </div>
                  
                  {currentConfig.type === 'select' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Các tùy chọn (Mỗi tùy chọn 1 dòng)
                      </label>
                      <textarea
                        value={(currentConfig.options || []).join('\n')}
                        onChange={(e) => handleFieldConfigChange(field.key, 'select', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-[#E2E2D8] rounded bg-white text-[12px] text-[#3C3633] outline-none focus:border-[#7A8471] transition-colors resize-none"
                        placeholder="Tùy chọn 1&#10;Tùy chọn 2"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {onSave && (
            <div className="pt-4 flex justify-end border-t border-[#E2E2D8]">
              <button
                onClick={onSave}
                className="px-6 py-2 bg-[#5A5A40] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#4A4A35] transition-colors mt-4"
              >
                Lưu cấu hình
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
