import React from 'react';

const StatusGuide: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">병상 현황 가이드</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 bg-emerald-50 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mb-1"></div>
          <span className="text-xs font-bold text-emerald-700">원활/여유</span>
          <span className="text-[10px] text-emerald-600 text-center leading-tight mt-1">66% 이상 / 5석 이상</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-amber-50 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-amber-500 mb-1"></div>
          <span className="text-xs font-bold text-amber-700">보통</span>
          <span className="text-[10px] text-amber-600 text-center leading-tight mt-1">33~66% / 1~4석</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-rose-50 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-rose-500 mb-1"></div>
          <span className="text-xs font-bold text-rose-700">혼잡/만실</span>
          <span className="text-[10px] text-rose-600 text-center leading-tight mt-1">33% 미만 / 0석</span>
        </div>
      </div>
    </div>
  );
};

export default StatusGuide;