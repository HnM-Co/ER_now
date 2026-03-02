import React, { useState } from 'react';
import { HospitalData } from '../types';
import { getBedStatusColor, getBedStatusText } from '../services/api';

interface HospitalCardProps {
  data: HospitalData;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ data, isFavorite, onToggleFavorite }) => {
  const [activeMsg, setActiveMsg] = useState<'er' | 'severe' | null>(null);

  const toggleMsg = (type: 'er' | 'severe') => {
    setActiveMsg(prev => prev === type ? null : type);
  };

  const getKakaoNaviUrl = () => {
    if (data.wgs84Lat && data.wgs84Lon) {
      return `https://map.kakao.com/link/to/${encodeURIComponent(data.dutyName)},${data.wgs84Lat},${data.wgs84Lon}`;
    }
    return `https://map.kakao.com/link/search/${encodeURIComponent(data.dutyName)}`;
  };

  const renderCompactBedStat = (title: string, available: number, total?: number, isSpecial = false) => {
    const displayValue = (total !== undefined && total > 0) ? `${available}/${total}` : `${available}`;
    const colorClass = getBedStatusColor(available, total);
    const isInactive = (total !== undefined && total === 0) || (total === undefined && available === 0 && isSpecial);

    if (isInactive) {
         return (
            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border bg-slate-50 border-slate-100 text-slate-400`}>
                <span className="text-[9px] font-semibold opacity-70">{title}</span>
                <span className="text-xs font-bold leading-none mt-0.5">-</span>
            </div>
         );
    }

    return (
      <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border ${colorClass} transition-colors`}>
        <span className="text-[9px] font-semibold opacity-90">{title}</span>
        <span className="text-xs font-bold leading-none mt-0.5">{displayValue}</span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 ${isFavorite ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'}`}>
      <div className="p-3">
        {/* First Row: Name, Distance, Bed Blocks, Favorite */}
        <div className="flex justify-between items-start gap-2">
          {/* Left: Name & Distance */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-grow">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
                {data.dutyName}
              </h3>
              {data.distance !== undefined && (
                <span className="flex items-center text-indigo-600 font-bold text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                   </svg>
                   {data.distance}km
                </span>
              )}
            </div>
            
            {/* Second Row (Left): Contact & Navi */}
            <div className="flex items-center gap-2">
              <a href={`tel:${data.dutyTel3}`} className="inline-flex items-center text-[11px] font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 px-1.5 py-1 rounded border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {data.dutyTel3}
              </a>
              
              <a 
                  href={getKakaoNaviUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-[10px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-1.5 py-1 rounded border border-yellow-200 transition-colors"
              >
                  <img 
                      src="https://t1.daumcdn.net/localimg/localimages/07/2018/pc/common/logo_kakaomap.png" 
                      alt="Kakao Map" 
                      className="w-3 h-3 mr-1 object-contain"
                  />
                  길찾기
              </a>
            </div>
          </div>

          {/* Right: Bed Blocks & Favorite */}
          <div className="flex items-start gap-1.5 flex-shrink-0">
            <div className="flex gap-1">
              {renderCompactBedStat("일반", data.hvec, data.hvec_total)}
              {renderCompactBedStat("소아", data.hv28, data.hv28_total, true)}
              {renderCompactBedStat("분만", data.hv42, data.hv42_total, true)}
            </div>
            <button
                onClick={onToggleFavorite}
                className="p-1 -mr-1 -mt-1 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
                {isFavorite ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400 drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 hover:text-amber-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                )}
            </button>
          </div>
        </div>

        {/* Third Row: Isolation, CT/MRI, Bell, Speaker */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-medium">격리(음압/일반)</span>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                      {data.hv29 >= 0 ? data.hv29 : 0} / {data.hv30 >= 0 ? data.hv30 : 0}
                  </span>
              </div>
              
              <div className="flex gap-1">
                  {data.hvctayn === 'Y' && <span className="px-1 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">CT</span>}
                  {data.hvmriayn === 'Y' && <span className="px-1 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">MRI</span>}
                  {data.hventiayn === 'Y' && <span className="px-1 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded font-medium border border-slate-200">인공호흡기</span>}
              </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => toggleMsg('er')} 
              className={`p-1.5 rounded transition-colors ${activeMsg === 'er' ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              aria-label="응급실 메시지"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button 
              onClick={() => toggleMsg('severe')} 
              className={`p-1.5 rounded transition-colors ${activeMsg === 'severe' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              aria-label="중증응급질환 메시지"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable Message Area */}
        {activeMsg === 'er' && (
          <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 animate-in fade-in slide-in-from-top-2">
            <div className="font-bold mb-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              응급실 메시지
            </div>
            <p className="leading-relaxed">{data.erMsg || "등록된 메시지가 없습니다."}</p>
          </div>
        )}
        
        {activeMsg === 'severe' && (
          <div className="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded text-xs text-rose-800 animate-in fade-in slide-in-from-top-2">
            <div className="font-bold mb-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              중증응급질환 메시지
            </div>
            <p className="leading-relaxed">{data.severeMsg || "등록된 메시지가 없습니다."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalCard;