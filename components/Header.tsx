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
        <div className="flex justify-between items-center">
            {/* GPS Button Removed */}
        </div>
      </div>
    </header>
  );
};

export default Header;