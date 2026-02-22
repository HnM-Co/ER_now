import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Prevent ad from loading multiple times if component re-renders
    const pushAd = () => {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        // Only push if there are no ads inside the element yet
        if (adRef.current && adRef.current.innerHTML.trim() === '') {
            adsbygoogle.push({});
        }
      } catch (e) {
        console.error("AdSense error:", e);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(pushAd, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto my-2 px-4 overflow-hidden text-center">
      {/* 
        Google AdSense Responsive Unit 
      */}
      <div className="bg-white border border-slate-100 rounded-lg p-0.5 shadow-sm min-h-[55px] relative text-center flex items-center justify-center overflow-hidden">
          <span className="text-[9px] text-slate-300 absolute top-0 left-1 z-10 bg-white/80 px-1 rounded-br">Ad</span>
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '50px', maxHeight: '60px', width: '100%' }} // min-height prevents Cumulative Layout Shift (CLS)
            data-ad-client="ca-pub-7969346905229420" 
            data-ad-slot="0000000000"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
      </div>
    </div>
  );
};

export default AdBanner;