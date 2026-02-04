import { HospitalData, REGIONS } from '../types';
import { parseHospitalXml } from '../utils/xmlParser';

// [실제 데이터 보장 수정]
// 환경변수가 로드되지 않는 상황에서도 실제 데이터를 보여주기 위해 키를 백업으로 설정합니다.
const ENV_API_KEY = (import.meta as any).env?.VITE_DATA_API_KEY || "a0f92aac1356efd3339d4c1a42571bc0420edd9fe0a5b9c4a4ee02386223cf60";

const CACHE_KEY_PREFIX = "ER_DATA_CACHE_";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export type DataSourceType = 'REALTIME' | 'SIMULATION';

export interface FetchResult {
  data: HospitalData[];
  source: DataSourceType;
}

interface CachedData {
  timestamp: number;
  data: HospitalData[];
}

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return Number(d.toFixed(1));
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// Generate Mock Data for Simulation Mode with Totals for % demonstration
const generateMockData = (region: string): HospitalData[] => {
  const baseRegion = REGIONS.find(r => r.value === region) || REGIONS[0];
  const baseLat = baseRegion.lat || 37.5665;
  const baseLon = baseRegion.lon || 126.9780;

  return Array.from({ length: 15 }).map((_, i) => {
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lon = baseLon + (Math.random() - 0.5) * 0.1;
    
    // Simulate capacities
    const totalER = 20 + Math.floor(Math.random() * 30);
    const availER = Math.floor(Math.random() * totalER);
    
    const totalPed = Math.random() > 0.3 ? 5 + Math.floor(Math.random() * 10) : 0;
    const availPed = totalPed > 0 ? Math.floor(Math.random() * totalPed) : 0;

    const totalDel = Math.random() > 0.5 ? 2 + Math.floor(Math.random() * 5) : 0;
    const availDel = totalDel > 0 ? Math.floor(Math.random() * totalDel) : 0;

    return {
      hpid: `MOCK_${region}_${i}`,
      dutyName: `${baseRegion.label} 사랑${i+1}병원 [가상]`,
      dutyTel3: `02-1234-${1000 + i}`,
      
      hvec: availER,
      hvec_total: totalER,
      
      hv28: availPed,
      hv28_total: totalPed,
      
      hv42: availDel,
      hv42_total: totalDel,

      hv29: Math.floor(Math.random() * 2),
      hv30: Math.floor(Math.random() * 5),
      hvctayn: Math.random() > 0.2 ? 'Y' : 'N',
      hvmriayn: Math.random() > 0.2 ? 'Y' : 'N',
      hvangioayn: Math.random() > 0.5 ? 'Y' : 'N',
      hventiayn: Math.random() > 0.3 ? 'Y' : 'N',
      phpid: `PH${i}`,
      lastUpdate: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      wgs84Lat: lat,
      wgs84Lon: lon
    };
  });
};

export const fetchHospitalData = async (fullRegionValue: string): Promise<FetchResult> => {
  // Clean the API Key (remove quotes/spaces)
  const rawKey = ENV_API_KEY.replace(/['"]/g, '').trim();

  if (!rawKey) {
    console.warn("API Key is missing. Falling back to simulation mode.");
    return { data: generateMockData(fullRegionValue), source: 'SIMULATION' };
  }

  // Robust Key Handling for Data.go.kr:
  // If the key contains '%', it is likely already the 'Encoding' key -> Use as is.
  // If not, it is the 'Decoding' key -> Apply encodeURIComponent.
  const serviceKey = rawKey.includes('%') ? rawKey : encodeURIComponent(rawKey);

  const parts = fullRegionValue.split(' ');
  const stage1 = parts[0];
  const stage2 = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

  const cacheKey = `${CACHE_KEY_PREFIX}${fullRegionValue}`;
  
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    const cached: CachedData = JSON.parse(cachedRaw);
    const now = Date.now();
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${fullRegionValue}`);
      return { data: cached.data, source: 'REALTIME' };
    }
  }

  // Use local proxy path (Handled by Vite in Dev, Vercel Rewrites in Prod)
  const baseUrl = "/api/er-data";
  
  let queryString = `serviceKey=${serviceKey}&STAGE1=${encodeURIComponent(stage1)}&pageNo=1&numOfRows=100`;
  
  if (stage2) {
    queryString += `&STAGE2=${encodeURIComponent(stage2)}`;
  }
  
  const targetUrl = `${baseUrl}?${queryString}`;
  
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
    
    // Check for API Error Response in XML
    if (xmlText.includes("<cmmMsgHeader>") || xmlText.includes("<errMsg>") || xmlText.includes("SERVICE KEY")) {
        console.warn("API Error Response (Check your API Key):", xmlText);
        // Fallback to simulation
        return { data: generateMockData(fullRegionValue), source: 'SIMULATION' };
    }

    const parsedData = parseHospitalXml(xmlText);

    if (parsedData.length > 0) {
      const cachePayload: CachedData = {
        timestamp: Date.now(),
        data: parsedData
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
      return { data: parsedData, source: 'REALTIME' };
    } else {
        // Empty data but valid XML? likely just no hospitals found in that region
        if (xmlText.includes("<items>")) {
             return { data: [], source: 'REALTIME' };
        }
        console.warn("API returned unexpected data structure, switching to simulation.");
        return { data: generateMockData(fullRegionValue), source: 'SIMULATION' };
    }

  } catch (error) {
    console.error("Failed to fetch hospital data:", error);
    return { data: generateMockData(fullRegionValue), source: 'SIMULATION' };
  }
};

export const getBedStatusColor = (available: number, total?: number) => {
  if (total !== undefined && total > 0) {
    const ratio = available / total;
    if (ratio > 0.66) return "text-emerald-700 bg-emerald-100 border-emerald-200"; 
    if (ratio >= 0.33) return "text-amber-700 bg-amber-100 border-amber-200"; 
    return "text-rose-700 bg-rose-100 border-rose-200"; 
  }

  if (available >= 5) return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (available >= 1) return "text-amber-700 bg-amber-100 border-amber-200";
  return "text-rose-700 bg-rose-100 border-rose-200";
};

export const getBedStatusText = (available: number, total?: number) => {
  if (total !== undefined && total > 0) {
    const ratio = available / total;
    if (ratio > 0.66) return "원활";
    if (ratio >= 0.33) return "보통";
    return "혼잡";
  }

  if (available >= 5) return "여유";
  if (available >= 1) return "보통";
  return "만실/대기";
};