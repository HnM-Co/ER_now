// This service dynamically loads the Kakao Maps SDK script using the API key.
// IMPORTANT: The Maps SDK uses 'window.kakao', while the General SDK uses 'window.Kakao'.

declare global {
  interface Window {
    kakao: any;
  }
}

// Access environment variable safely using optional chaining
// Use the provided key as a fallback if the environment variable is missing
const KAKAO_APP_KEY = (import.meta as any).env?.VITE_KAKAO_APP_KEY || "64bf38c57c16eb05b5a0d2cf57eb043a";

export const loadKakaoSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return;
    
    // Check if already loaded (Lowercase 'kakao' for maps)
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // Check if script tag already exists
    if (document.getElementById('kakao-sdk')) {
      resolve(); 
      return;
    }

    if (!KAKAO_APP_KEY) {
      console.warn("Kakao App Key is missing");
      resolve(); // Resolve anyway so app doesn't crash
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-sdk';
    // Use https explicitly to avoid Mixed Content issues
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      // For Maps SDK, we use kakao.maps.load
      if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
              console.log("Kakao Maps SDK Initialized");
              resolve();
          });
      } else {
          // Sometimes namespace isn't immediately available even after onload
          // We resolve anyway and let the component retry logic handle the window.kakao check
          console.warn("kakao.maps namespace not found immediately after script load");
          resolve(); 
      }
    };

    script.onerror = (err) => {
      console.error("Failed to load Kakao SDK", err);
      reject(err);
    };

    document.head.appendChild(script);
  });
};