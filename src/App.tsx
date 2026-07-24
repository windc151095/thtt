import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { Settings, PenTool, Image as ImageIcon, Download, ZoomIn, ZoomOut, Eye, Home } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { motion, AnimatePresence } from 'motion/react';

import { defaultFormData, defaultTemplateConfig, FormData, TemplateConfig } from './types';
import { FormInput } from './components/FormInput';
import { TemplatePreview } from './components/TemplatePreview';
import { AdminPanel } from './components/AdminPanel';

type Tab = 'fill' | 'preview' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fill');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [previewZoom, setPreviewZoom] = useState(window.innerWidth < 1024 ? Math.max((window.innerWidth - 64) / 1000, 0.3) : 1);
  const [previewHeight, setPreviewHeight] = useState(1000);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<FormData | null>(null);

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(defaultTemplateConfig);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setPreviewHeight((entry.target as HTMLElement).offsetHeight);
        }
      });
      observer.observe(previewRef.current);
      return () => observer.disconnect();
    }
  }, [activeTab, formData, templateConfig]);

  useEffect(() => {
    const autoDraft = localStorage.getItem('auto_draft');
    if (autoDraft) {
      try {
        const parsed = JSON.parse(autoDraft);
        // Only restore if it's less than 24h old and not deeply equal to default
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000 && parsed.data) {
          if (JSON.stringify(parsed.data) !== JSON.stringify(defaultFormData)) {
             setDraftToRestore(parsed.data);
             setShowRestorePrompt(true);
          }
        }
      } catch (e) {
        console.error('Lỗi khi đọc auto_draft', e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData !== defaultFormData) {
      localStorage.setItem('auto_draft', JSON.stringify({
        data: formData,
        timestamp: Date.now()
      }));
    }
  }, [formData]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, 'config', 'global');
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          setTemplateConfig(prev => ({ ...prev, ...docSnap.data() as Partial<TemplateConfig> }));
        }
      } catch (e) {
        console.error('Lỗi khi tải cấu hình', e);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 30000); // Sync config every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'global');
      await setDoc(configRef, templateConfig);
      alert('Đã lưu tùy chọn cấu hình thành công cho tất cả mọi người!');
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi lưu cấu hình: ' + e.message);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(() => {
    if (previewRef.current === null) {
      return;
    }
    setIsExporting(true);
    
    // Slight delay to ensure React has fully rendered any state changes before snapshot
    setTimeout(() => {
      toPng(previewRef.current!, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: templateConfig.backgroundColor || '#ffffff',
        style: {
          margin: '0',
        }
      })
        .then((dataUrl) => {
          download(dataUrl, `TamThuc_${formData.date.replace(/\//g, '-')}.png`);
          setIsExporting(false);
        })
        .catch((err) => {
          console.error('Error exporting image', err);
          alert('Có lỗi xảy ra khi xuất ảnh.');
          setIsExporting(false);
        });
    }, 100);
  }, [previewRef, formData.date]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#3C3633] font-sans flex flex-col">
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-serif italic text-xl text-[#5A5A40] mb-2">Khôi phục bài viết?</h3>
            <p className="text-sm text-gray-600 mb-6">Bạn có một bài viết đang soạn dở. Bạn có muốn khôi phục lại không?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRestorePrompt(false);
                  setDraftToRestore(null);
                  localStorage.removeItem('auto_draft');
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => {
                  if (draftToRestore) setFormData(draftToRestore);
                  setShowRestorePrompt(false);
                }}
                className="px-4 py-2 bg-[#7A8471] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#606958] transition-colors"
              >
                Khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <header className="h-16 bg-white border-b border-[#E2E2D8] flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7A8471] rounded-full flex items-center justify-center text-white font-serif italic shadow-sm">S</div>
          <h1 className="font-serif text-xl font-semibold tracking-tight uppercase text-[#5A5A40] hidden sm:block">Sống Sáng Suốt</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-lg">
            <button
              onClick={() => setActiveTab('fill')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                activeTab === 'fill' ? 'bg-white shadow-sm text-[#3C3633]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home className="w-3 h-3" />
              <span className="hidden sm:inline">Trang chủ</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                activeTab === 'admin' ? 'bg-white shadow-sm text-[#3C3633]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Quản trị</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden bg-[#F0F0E8]">
        <section className="flex-1 flex justify-center overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'fill' && (
              <motion.div
                key="fill"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="w-full max-w-[600px]"
              >
                <FormInput data={formData} config={templateConfig} onChange={setFormData} onPreview={() => setActiveTab('preview')} />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="w-full max-w-[600px]"
              >
                <AdminPanel 
                  config={templateConfig} 
                  onChange={setTemplateConfig} 
                  onSave={handleSaveConfig}
                  onViewDraft={(data) => {
                    setFormData(data);
                    setActiveTab('preview');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-full max-w-[1020px] flex flex-wrap gap-4 justify-center sm:justify-between items-center mb-4 px-4">
                  <div className="flex gap-2 bg-[#E2E2D8] p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('fill')}
                      className="relative p-2 rounded-md text-gray-500 hover:text-gray-800 transition-colors z-10"
                      title="Nhập liệu"
                    >
                      <PenTool className="relative z-20 w-4 h-4" />
                    </button>
                    <button
                      className="relative p-2 rounded-md text-[#3C3633] transition-colors z-10"
                      title="Xem trước"
                    >
                      <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white shadow-sm rounded-md -z-10" />
                      <Eye className="relative z-20 w-4 h-4" />
                    </button>
                  </div>

              <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm">
                <button 
                  onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))}
                  className="p-1.5 text-gray-500 hover:text-[#5A5A40] hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-medium text-gray-500 w-12 text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button 
                  onClick={() => setPreviewZoom(z => Math.min(2, z + 0.1))}
                  className="p-1.5 text-gray-500 hover:text-[#5A5A40] hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center px-5 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isExporting ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Xuất ra ảnh (.png)</span>
                    <span className="sm:hidden ml-1">Xuất ảnh</span>
                  </>
                )}
              </button>
            </div>

            <div className="w-full overflow-auto custom-scrollbar pb-24">
              <div className="w-fit min-w-full flex justify-center px-4">
                <div style={{ width: `${1000 * previewZoom}px`, height: `${previewHeight * previewZoom}px`, transition: 'width 0.2s, height 0.2s' }} className="shrink-0 relative">
                  <div 
                    className="origin-top-left w-[1000px] bg-white shadow-2xl transition-transform duration-200"
                    style={{ transform: `scale(${previewZoom})` }}
                  >
                    <TemplatePreview ref={previewRef} data={formData} config={templateConfig} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
