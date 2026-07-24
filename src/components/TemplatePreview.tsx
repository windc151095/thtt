import React, { forwardRef } from 'react';
import { FormData, TemplateConfig } from '../types';

interface TemplatePreviewProps {
  data: FormData;
  config: TemplateConfig;
}

export const TemplatePreview = forwardRef<HTMLDivElement, TemplatePreviewProps>(
  ({ data, config }, ref) => {
    const {
      fontSize,
      textColor,
      fontFamily,
      headingColor1,
      headingColor2,
      borderColor1,
      borderColor2,
      borderColor3,
    } = config;

    return (
      <div
        ref={ref}
        className="w-[1000px] flex flex-col gap-6 relative pb-12"
        style={{ fontFamily, fontSize: `${fontSize}px`, color: textColor, backgroundColor: config.backgroundColor || '#ffffff' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start pt-8 px-8 border-b-[1px] pb-6" style={{ borderColor: headingColor1 }}>
          {/* Logo Area */}
          <div className="w-[300px] text-center mt-2 flex flex-col items-center">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Sống Sáng Suốt Logo" className="w-full max-h-[80px] object-contain mb-4" />
            ) : (
              <div className="mb-4 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg w-full h-[80px] flex flex-col items-center justify-center">
                <span className="text-xs font-bold uppercase">Chưa có Logo</span>
                <span className="text-[10px]">Vào Cài đặt để thêm Logo</span>
              </div>
            )}
            
            <p className="font-bold text-[14px] mt-2" style={{ color: headingColor1 }}>
              Writer: {data.writer || '....................'}
            </p>
            <p className="italic text-[14px]" style={{ color: headingColor1 }}>
              {data.date || '..../..../202..'}
            </p>
          </div>

          {/* Center Titles */}
          <div className="text-center flex-1 mt-2">
            <h2 className="font-bold text-[18px] uppercase mb-1" style={{ color: headingColor2 }}>
              THỰC LUYỆN TÂM THỨC
            </h2>
            <h3 className="font-bold text-[16px] uppercase mb-4" style={{ color: headingColor1 }}>
              20 BỘ ĐỜI SỐNG TÂM THỨC
            </h3>
            <div className="flex justify-center items-center gap-1 text-[14px] font-bold italic mt-8">
              <span className="text-[14px]" style={{ color: headingColor2 }}>Tình huống:</span>
              <span className="text-[14px]" style={{ color: headingColor1 }}>{data.tinhHuong || 'Nuông chiều mình trong mua sắm'}</span>
            </div>
          </div>

          {/* Right Area */}
          <div className="w-[300px] text-center mt-2 flex flex-col items-center">
            <h4 className="font-bold text-[14px] uppercase mb-0.5">
              <span style={{ color: headingColor2 }}>BỘ 01.</span> <span style={{ color: headingColor1 }}>ĐỜI SỐNG CÁ NHÂN</span>
            </h4>
            <div className="font-bold text-[14px] mb-0.5">
              <span style={{ color: headingColor2 }}>Giai đoạn 01. </span><span style={{ color: headingColor1 }}>Hình thành nền móng</span>
            </div>
            <div className="flex justify-center items-center gap-1 text-[14px] font-bold">
              
              <span style={{ color: headingColor1 }}>{data.thucCanh || 'Được nuông chiều từ nhỏ'}</span>
            </div>
          </div>
        </div>

        {/* Middle Two Columns */}
        <div className="grid grid-cols-2 gap-4 px-8 mt-2 relative">
          {/* Left Column */}
          <div>
            <h3 className="font-bold uppercase mb-2 tracking-wide text-[16px]" style={{ color: headingColor1, fontFamily: "'Google Sans', sans-serif" }}>
              NHẬN DẠNG VÔ THỨC
            </h3>
            <div
              className="border-[1px] flex flex-col min-h-[400px] bg-transparent"
              style={{ borderColor: borderColor1 }}
            >
              <div
                className="p-3 border-b-[1px] flex-1"
                style={{ borderColor: borderColor1 }}
              >
                <div style={{ color: headingColor1 }} className="mb-1 font-bold text-[14px]">1. Soi tính xấu <span className="font-normal">(Mình đang có tính xấu gì)</span></div>
                <div className="whitespace-pre-wrap">{data.soiTinhXau}</div>
              </div>
              <div
                className="p-3 border-b-[1px] flex-[2]"
                style={{ borderColor: borderColor1 }}
              >
                <div style={{ color: headingColor1 }} className="mb-1 font-bold text-[14px]">2. Xét độc hại <span className="font-normal">(Độc tính nào đang vận hành)</span></div>
                <div className="whitespace-pre-wrap mb-2">{data.xetDocHai}</div>
              </div>
              <div className="p-3 flex-1">
                <div style={{ color: headingColor1 }} className="mb-1 font-bold text-[14px]">3. Thấy hậu quả <span className="font-normal">(Hậu quả nào sẽ xảy ra)</span></div>
                <div className="whitespace-pre-wrap">{data.thayHauQua}</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="font-bold uppercase mb-2 tracking-wide text-[16px]" style={{ color: headingColor2, fontFamily: "'Google Sans', sans-serif" }}>
              NHẬN DẠNG TÂM THỨC
            </h3>
            <div
              className="border-[1px] flex flex-col min-h-[400px] bg-transparent"
              style={{ borderColor: borderColor2 }}
            >
              <div
                className="p-3 border-b-[1px] flex-1"
                style={{ borderColor: borderColor2 }}
              >
                <div style={{ color: headingColor2 }} className="mb-1 font-bold text-[14px]">1. Nhìn gốc <span className="font-normal">(Nhân gốc lành cấy sâu)</span></div>
                <div className="whitespace-pre-wrap">{data.nhinGoc}</div>
              </div>
              <div
                className="p-3 border-b-[1px] flex-[2]"
                style={{ borderColor: borderColor2 }}
              >
                <div style={{ color: headingColor2 }} className="mb-1 font-bold text-[14px]">2. Chọn tâm <span className="font-normal">(Xây giá trị phát triển)</span></div>
                <div className="whitespace-pre-wrap mb-2">{data.chonTam}</div>
              </div>
              <div className="p-3 flex-1">
                <div style={{ color: headingColor2 }} className="mb-1 font-bold text-[14px]">3. Dưỡng tính <span className="font-normal">(Đức tính cần rèn luyện)</span></div>
                <div className="whitespace-pre-wrap">{data.duongTinh}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Table */}
        <div className="mt-4 px-8">
          <h3 className="font-bold uppercase mb-2 tracking-wide text-[16px]" style={{ color: headingColor2, fontFamily: "'Google Sans', sans-serif" }}>
            THỰC LUYỆN TÂM THỨC
          </h3>
          <div
            className="border-[1px] flex flex-col bg-transparent"
            style={{ borderColor: borderColor3 }}
          >
            {/* Row 1 */}
            <div className="flex border-b-[1px]" style={{ borderColor: borderColor3 }}>
              <div
                className="w-48 border-r-[1px] p-4 flex items-start justify-start font-bold text-[14px]"
                style={{ borderColor: borderColor3, color: headingColor2 }}
              >
                1. Phá chấp mở đường
              </div>
              <div className="flex-1 p-4 whitespace-pre-wrap min-h-[60px]">{data.phaChap}</div>
            </div>
            {/* Row 2 */}
            <div className="flex border-b-[1px]" style={{ borderColor: borderColor3 }}>
              <div
                className="w-48 border-r-[1px] p-4 flex items-start justify-start font-bold text-[14px]"
                style={{ borderColor: borderColor3, color: headingColor2 }}
              >
                2. Định tâm giải quyết
              </div>
              <div className="flex-1 p-4 whitespace-pre-wrap min-h-[60px]">{data.dinhTam}</div>
            </div>
            {/* Row 3 */}
            <div className="flex border-b-[1px]" style={{ borderColor: borderColor3 }}>
              <div
                className="w-48 border-r-[1px] p-4 flex items-start justify-start font-bold text-[14px]"
                style={{ borderColor: borderColor3, color: headingColor2 }}
              >
                3. Phát tuệ hành xử
              </div>
              <div className="flex-1 p-4 whitespace-pre-wrap min-h-[60px]">{data.phatTue}</div>
            </div>
            {/* Row 4 */}
            <div className="flex">
              <div
                className="w-48 border-r-[1px] p-4 flex items-start justify-start font-bold text-[14px]"
                style={{ borderColor: borderColor3, color: headingColor2 }}
              >
                4. Thành người đáng tin
              </div>
              <div className="flex-1 p-4 whitespace-pre-wrap min-h-[60px]">{data.thanhNguoi}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TemplatePreview.displayName = 'TemplatePreview';
