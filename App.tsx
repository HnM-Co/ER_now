import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import HospitalCard from './components/HospitalCard';
import StatusGuide from './components/StatusGuide';
import AdBanner from './components/AdBanner';
import { fetchHospitalData, calculateDistance, DataSourceType } from './services/api';
import { HospitalData, REGIONS, RegionOption } from './types';

const FAVORITES_KEY = 'ER_FAVORITES_DATA';

function App() {
  const [selectedMainRegion, setSelectedMainRegion] = useState<RegionOption>(REGIONS[0]);
  const [selectedSubRegion, setSelectedSubRegion] = useState<string>('전체'); // '전체' means All
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPediatric, setFilterPediatric] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<DataSourceType>('REALTIME');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(30);
  
  // Favorites State (Stores full hospital objects to display even if not in current region)
  const [favorites, setFavorites] = useState<HospitalData[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load favorites", e);
      return [];
    }
  });
  
  // Location State
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((hospital: HospitalData) => {
    setFavorites(prev => {
      const exists = prev.some(h => h.hpid === hospital.hpid);
      if (exists) {
        return prev.filter(h => h.hpid !== hospital.hpid);
      } else {
        return [...prev, hospital];
      }
    });
  }, []);

  // Find nearest region based on coords (Mapped to Main Region)
  const findNearestRegion = (lat: number, lon: number): RegionOption => {
    let nearest = REGIONS[0];
    let minDist = Infinity;

    REGIONS.forEach(region => {
      if (region.lat && region.lon) {
        const dist = calculateDistance(lat, lon, region.lat, region.lon);
        if (dist < minDist) {
          minDist = dist;
          nearest = region;
        }
      }
    });
    return nearest;
  };

  const getLocation = useCallback((silentMode: boolean = false) => {
    setIsLocating(true);

    const handleSuccess = (lat: number, lon: number, source: 'GPS' | 'IP') => {
        console.log(`Location found via ${source}:`, lat, lon);
        setUserLocation({ lat, lon });
        
        // Auto-select nearest main region
        const nearestRegion = findNearestRegion(lat, lon);
        
        if (nearestRegion.value !== selectedMainRegion.value) {
            setSelectedMainRegion(nearestRegion);
            setSelectedSubRegion('전체');
        }
        
        setIsLocating(false);
        if (source === 'IP' && !silentMode) {
             alert("GPS 신호를 찾을 수 없어 IP 기반으로 대략적인 위치를 잡았습니다.");
        }
    };

    // IP Location Fallback
    const fetchIpLocation = async () => {
        try {
            console.log("Attempting IP location fallback...");
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
                handleSuccess(data.latitude, data.longitude, 'IP');
            } else {
                throw new Error("Invalid IP data");
            }
        } catch (e) {
            console.error("IP Location failed", e);
            setIsLocating(false);
            if (!silentMode) {
                alert("위치 정보를 가져올 수 없습니다. GPS 설정이나 네트워크 연결을 확인해주세요.");
            }
        }
    };

    // 1. Check if Geolocation is supported
    if (!navigator.geolocation) {
       fetchIpLocation();
       return;
    }

    // 2. HTTPS Check (skip for localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        // GPS won't work on non-https, go straight to IP
        fetchIpLocation();
        return;
    }

    // 3. Try GPS
    navigator.geolocation.getCurrentPosition(
        (position) => {
            handleSuccess(position.coords.latitude, position.coords.longitude, 'GPS');
        },
        (error) => {
            console.warn("GPS failed, falling back to IP...", error);
            // On any GPS error (Timeout, Permission Denied, etc), try IP
            fetchIpLocation();
        },
        { timeout: 7000, enableHighAccuracy: true }
    );
  }, [selectedMainRegion]);

  const handleGPSClick = () => getLocation(false);

  // Attempt auto-location on first mount
  useEffect(() => {
     if ('geolocation' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
                getLocation(true);
            }
        }).catch(() => {
            // Permission API not supported, ignore
        });
     }
  }, []); // Only run once on mount

  // Construct the full query string (e.g., "서울특별시 강남구" or "서울특별시")
  const loadData = useCallback(async (mainRegion: RegionOption, subRegion: string) => {
    setLoading(true);
    setError(null);
    try {
      let queryValue = mainRegion.value;
      if (subRegion !== '전체') {
          queryValue = `${mainRegion.value} ${subRegion}`;
      }

      const result = await fetchHospitalData(queryValue);
      setHospitals(result.data);
      setDataSource(result.source);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when selection changes
  useEffect(() => {
    loadData(selectedMainRegion, selectedSubRegion);
    setVisibleCount(30); // Reset pagination on region change
  }, [selectedMainRegion, selectedSubRegion, loadData]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [filterPediatric, searchTerm]);

  // Handle Filtering, Sorting, and Favorites Merging
  const processedHospitals = useMemo(() => {
    const favoriteIds = new Set(favorites.map(f => f.hpid));
    
    // 1. Create a map of current API results for fresh data lookup
    const currentApiMap = new Map(hospitals.map(h => [h.hpid, h]));

    // 2. Prepare Display List
    // - Favorites come first. Use fresh data if available in current API, otherwise use cached favorite data.
    // - Non-favorites come next, only from current API.
    
    // 2a. Process Favorites (Always include them)
    const processedFavorites = favorites.map(fav => {
        const freshData = currentApiMap.get(fav.hpid);
        // Use fresh data if available, but retain the knowledge that it is a favorite
        return freshData || fav;
    });

    // 2b. Process Non-Favorites (Only from current region)
    const nonFavorites = hospitals.filter(h => !favoriteIds.has(h.hpid));

    // Combine
    let combined = [...processedFavorites, ...nonFavorites];

    // 3. Recalculate Distances for ALL items (if user has location)
    if (userLocation) {
        combined = combined.map(h => {
            if (h.wgs84Lat && h.wgs84Lon) {
                return { 
                    ...h, 
                    distance: calculateDistance(userLocation.lat, userLocation.lon, h.wgs84Lat, h.wgs84Lon) 
                };
            }
            return h;
        });
    }

    // 4. Filter by Pediatric
    if (filterPediatric) {
      combined = combined.filter(h => h.hv28 > 0);
    }

    // 5. Filter by Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      combined = combined.filter(h => h.dutyName.toLowerCase().includes(term));
    }

    // 6. Sort
    combined.sort((a, b) => {
        const aIsFav = favoriteIds.has(a.hpid);
        const bIsFav = favoriteIds.has(b.hpid);

        // Priority 0: Favorites always on top
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;

        // Priority 1: Distance (Only if user GPS is active)
        if (userLocation) {
             // If both have distance, compare them
             if (a.distance !== undefined && b.distance !== undefined) {
                 return a.distance - b.distance;
             }
             // If only A has distance, A comes first
             if (a.distance !== undefined) return -1;
             // If only B has distance, B comes first
             if (b.distance !== undefined) return 1;
             // If neither has distance, fall through to next criteria (beds)
        }

        // Priority 2: General Bed Availability (descending)
        return b.hvec - a.hvec;
    });

    return combined;
  }, [hospitals, favorites, filterPediatric, searchTerm, userLocation]);

  const visibleHospitals = processedHospitals.slice(0, visibleCount);
  const hasMore = visibleCount < processedHospitals.length;

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 30);
  };



  const handleMainRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = REGIONS.find(r => r.value === e.target.value);
    if (region) {
      setSelectedMainRegion(region);
      setSelectedSubRegion('전체'); // Reset sub-region
    }
  };

  const handleSubRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedSubRegion(e.target.value);
  };

  const isFavorite = (hpid: string) => favorites.some(f => f.hpid === hpid);

  return (
    <div className="min-h-screen pb-12 flex flex-col bg-f3f4f6">
      <Header 
        onGpsClick={handleGPSClick} 
        isLocating={isLocating} 
      />

      <AdBanner />

      <main className="max-w-3xl mx-auto px-4 py-2 flex-grow w-full">
        {/* Source Badge */}
        <div className="flex justify-end mb-4">
             {dataSource === 'REALTIME' ? (
                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     국립중앙의료원 실시간
                 </span>
             ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                     가상 데이터 모드 (연동 실패 시뮬레이션)
                 </span>
             )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            
            {/* Main Region Select */}
            <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-500 z-10">
                시/도
                </label>
                <select
                value={selectedMainRegion.value}
                onChange={handleMainRegionChange}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none shadow-sm"
                >
                {REGIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                    {region.label}
                    </option>
                ))}
                </select>
                <div className="absolute right-2 top-3.5 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                </div>
            </div>

            {/* Sub Region Select */}
            <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-500 z-10">
                시/군/구
                </label>
                <select
                value={selectedSubRegion}
                onChange={handleSubRegionChange}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!selectedMainRegion.subRegions || selectedMainRegion.subRegions.length === 0}
                >
                <option value="전체">전체</option>
                {selectedMainRegion.subRegions?.map((sub) => (
                    <option key={sub} value={sub}>
                    {sub}
                    </option>
                ))}
                </select>
                <div className="absolute right-2 top-3.5 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                </div>
            </div>
            
            {/* Filter Toggle */}
            <button
                onClick={() => setFilterPediatric(!filterPediatric)}
                className={`flex-shrink-0 px-3 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1 text-sm whitespace-nowrap ${
                filterPediatric
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
            >
                {filterPediatric ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                )}
                {filterPediatric ? "소아응급" : "소아응급"}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
             </div>
             <input 
                type="text" 
                placeholder="병원명 검색 (예: 서울대병원)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
             />
             {searchTerm && (
                 <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                     </svg>
                 </button>
             )}
          </div>
        </div>

        <StatusGuide />

        {/* Info Banner */}
        <div className="bg-indigo-50 text-indigo-800 text-xs p-3 rounded-lg mb-6 flex items-start gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
           <p className="leading-relaxed">
             데이터는 10분 단위로 갱신됩니다. 방문 전 반드시 병원에 전화(☎)로 진료 가능 여부를 확인하세요. 
             {userLocation && " 거리 정보는 직선 거리 기준입니다."}
           </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p>실시간 병상 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-rose-100">
             <p className="text-rose-500 mb-2">{error}</p>
             <button 
               onClick={() => loadData(selectedMainRegion, selectedSubRegion)}
               className="text-sm text-slate-500 underline hover:text-indigo-600"
             >
               다시 시도하기
             </button>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-slate-800">
                   {selectedMainRegion.label} {selectedSubRegion !== '전체' ? selectedSubRegion : ''} 주변 {processedHospitals.length}곳
                   {userLocation ? (
                       <span className="text-indigo-600 ml-1">(거리순)</span>
                   ) : (
                       <span className="text-indigo-600 ml-1">(가용병상순)</span>
                   )}
                </span>
                <span className="text-xs text-slate-400">
                  {hospitals[0]?.lastUpdate || ''} 기준
                </span>
             </div>
             
             {processedHospitals.length === 0 ? (
               <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                 <p>
                    {searchTerm ? `'${searchTerm}'에 대한 검색 결과가 없습니다.` : '조건에 맞는 응급실 정보가 없습니다.'}
                 </p>
               </div>
             ) : (
               (() => {
                    const favs = visibleHospitals.filter(h => isFavorite(h.hpid));
                    const nonFavs = visibleHospitals.filter(h => !isFavorite(h.hpid));
                    
                    return (
                        <>
                            {/* Favorites */}
                            {favs.map(hospital => (
                                <HospitalCard 
                                    key={hospital.hpid} 
                                    data={hospital}
                                    isFavorite={true}
                                    onToggleFavorite={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(hospital);
                                    }}
                                />
                            ))}

                            {/* Ad after Favorites */}
                            {favs.length > 0 && (
                                <div className="w-full">
                                    <AdBanner />
                                </div>
                            )}

                            {/* Non-Favorites */}
                            {nonFavs.map((hospital, index) => (
                                <React.Fragment key={hospital.hpid}>
                                    <HospitalCard 
                                        data={hospital}
                                        isFavorite={false}
                                        onToggleFavorite={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(hospital);
                                        }}
                                    />
                                    {/* Ad every 10 items */}
                                    {(index + 1) % 10 === 0 && index !== nonFavs.length - 1 && (
                                        <div className="w-full">
                                            <AdBanner />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <button 
                                    onClick={handleLoadMore}
                                    className="w-full py-4 mt-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    더 보기 ({processedHospitals.length - visibleCount}개 남음)
                                </button>
                            )}
                        </>
                    );
               })()
             )}
          </div>
        )}
      </main>

      <footer className="w-full py-6 text-center border-t border-slate-200 mt-4 bg-white">
        <div className="text-slate-400 text-xs font-medium space-y-2">
            <p>@ acedoctor2026</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => alert("개인정보처리방침 준비중입니다.")} className="hover:text-slate-600">개인정보처리방침</button>
                <button onClick={() => alert("이용약관 준비중입니다.")} className="hover:text-slate-600">이용약관</button>
            </div>
        </div>
      </footer>

      {/* Persistent Refresh Button */}
      <button 
        onClick={() => loadData(selectedMainRegion, selectedSubRegion)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-200 transition-transform active:scale-95 z-40"
        aria-label="Refresh Data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}

export default App;