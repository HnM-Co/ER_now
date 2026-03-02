import React from 'react';
import { HospitalData } from '../types';
import { getBedStatusColor, getBedStatusText } from '../services/api';

interface HospitalCardProps {
  data: HospitalData;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ data, isFavorite, onToggleFavorite }) => {
  
  // Helper to get Kakao Map Navigation URL
  const getKakaoNaviUrl = () => {
    // Web Link: https://map.kakao.com/link/to/Name,Lat,Lon
    // This will open Kakao Map Web, or App if installed on mobile
    if (data.wgs84Lat && data.wgs84Lon) {
      return `https://map.kakao.com/link/to/${encodeURIComponent(data.dutyName)},${data.wgs84Lat},${data.wgs84Lon}`;
    }
    return `https://map.kakao.com/link/search/${encodeURIComponent(data.dutyName)}`;
  };

  const renderBedStat = (title: string, available: number, total?: number, isSpecial = false) => {
    // If we have total, show Avail/Total. If not, just Avail.
    // If total is 0 or undefined, logic handles it gracefully.
    const displayValue = (total !== undefined && total > 0) ? `${available}/${total}` : `${available}`;
    const statusText = getBedStatusText(available, total);
    const colorClass = getBedStatusColor(available, total);

    // If it's a special bed (Pediatric/Delivery) and total is 0 (meaning not available at all at this hospital), dim it.
    // But if we don't know total, we just show 0 availability.
    const isInactive = (total !== undefined && total === 0) || (total === undefined && available === 0 && isSpecial);

    if (isInactive) {
         return (
            <div className={`flex flex-col items-center justify-center p-2 rounded-lg border bg-slate-50 border-slate-100 text-slate-400`}>
                <span className="text-[10px] font-semibold mb-1 opacity-70">{title}</span>
                <span className="text-lg font-bold">-</span>
                <span className="text-[9px] mt-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-500">정보없음</span>
            </div>
         );
    }

    return (
      <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorClass} transition-colors`}>
        <span className="text-[10px] font-semibold mb-1 opacity-90">{title}</span>
        <span className="text-xl font-bold">{displayValue}</span>
        <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full bg-white/60 backdrop-blur-sm">
           {statusText}
        </span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border overflow-hidden hover:shadow-lg transition-all duration-200 ${isFavorite ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-100'}`}>
      {/* Header Section */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start relative">
        <div className="flex-grow pr-8">
          <div className="flex flex-col mb-1">
             <div className="flex items-center gap-1.5">
                {isFavorite && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    즐겨찾기
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {data.dutyName}
                </h3>
             </div>
             
             {data.distance !== undefined && (
               <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{data.distance}km</span>
                  <span className="text-[10px] text-slate-400 font-normal">・ 직선거리</span>
               </div>
             )}
          </div>
          
          <div className="flex flex-col gap-1 mt-2">
            <a href={`tel:${data.dutyTel3}`} className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {data.dutyTel3}
            </a>
            
            {/* Kakao Wayfinding Button */}
            <a 
                href={getKakaoNaviUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 px-2 py-1.5 rounded w-fit transition-colors mt-1"
            >
                <img 
                    src="https://t1.daumcdn.net/localimg/localimages/07/2018/pc/common/logo_kakaomap.png" 
                    alt="Kakao Map" 
                    className="w-3.5 h-3.5 mr-1 object-contain"
                />
                카카오맵 길찾기
            </a>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            {/* Favorite Button */}
            <button
                onClick={onToggleFavorite}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
                {isFavorite ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-400 drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-300 hover:text-amber-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                )}
            </button>

            {/* Call Action Button */}
            <a 
                href={`tel:${data.dutyTel3}`} 
                className="bg-indigo-600 text-white p-2.5 rounded-full shadow-md active:scale-95 transition-transform hover:bg-indigo-700 mt-1"
                aria-label="Call Hospital"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
            </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {renderBedStat("응급실(일반)", data.hvec, data.hvec_total)}
          {renderBedStat("응급실(소아)", data.hv28, data.hv28_total, true)}
          {renderBedStat("분만실", data.hv42, data.hv42_total, true)}
        </div>

        {/* Detailed Facilities */}
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                <span>격리 병상 (음압/일반)</span>
                <span className="font-mono font-bold">
                    {data.hv29 >= 0 ? data.hv29 : 0} / {data.hv30 >= 0 ? data.hv30 : 0}
                </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
                {data.hvctayn === 'Y' && <span className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-full font-medium">CT</span>}
                {data.hvmriayn === 'Y' && <span className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-full font-medium">MRI</span>}
                {data.hventiayn === 'Y' && <span className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-full font-medium">인공호흡기</span>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;