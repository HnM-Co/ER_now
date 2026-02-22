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
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm w-full h-[60px] relative flex items-center justify-center overflow-hidden mx-auto max-w-[320px]">
          <span className="text-[9px] text-slate-300 absolute top-0 left-0 z-10 bg-white/90 px-1 rounded-br border-b border-r border-slate-100">Ad</span>
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '320px', height: '50px' }}
                data-ad-client="ca-pub-7969346905229420" 
                data-ad-slot="0000000000"
                data-ad-format="horizontal"
                data-full-width-responsive="false"
            ></ins>
          </div>
      </div>
    </div>
  );
};

export default AdBanner;