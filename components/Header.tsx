import React from 'react';

interface HeaderProps {
  onGpsClick: () => void;
  isLocating: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGpsClick, isLocating }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white mr-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-none">ER now</h1>
                    <p className="text-[10px] text-slate-500 font-medium">실시간 응급실 병상 확인</p>
                </div>
            </div>
        </div>

        {/* Location Bar */}
        <div className="flex justify-between items-center mt-2">
            <button 
                onClick={onGpsClick}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLocating ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                )}
                내 위치 중심으로 보기 (거리순 정렬)
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;