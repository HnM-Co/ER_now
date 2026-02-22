import { HospitalData } from '../types';

/**
 * Parses the XML response from the National Medical Center API.
 */
export const parseHospitalXml = (xmlText: string): HospitalData[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");
    const result: HospitalData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      const getText = (tagName: string) => {
        return item.getElementsByTagName(tagName)[0]?.textContent ?? "";
      };

      const getNumber = (tagName: string) => {
        const val = parseFloat(getText(tagName)); 
        return isNaN(val) ? 0 : val;
      };

      // Note: wgs84Lat/Lon might not be present in all API operations, but we check anyway.
      const lat = getNumber("wgs84Lat");
      const lon = getNumber("wgs84Lon");

      // Note: Real-time API often doesn't return Totals (Total Capacity).
      // We will leave total fields undefined for real API data unless we find them.
      // If totals are missing, the UI should fallback to absolute number logic.

      result.push({
        hpid: getText("hpid"),
        dutyName: getText("dutyName"),
        dutyTel3: getText("dutyTel3"),
        
        // Available counts
        hvec: Math.floor(getNumber("hvec")), 
        hv28: Math.floor(getNumber("hv28")),
        hv29: Math.floor(getNumber("hv29")),
        hv30: Math.floor(getNumber("hv30")),
        hv42: Math.floor(getNumber("hv42")), // Delivery Room

        hvctayn: getText("hvctayn"),
        hvmriayn: getText("hvmriayn"),
        hvangioayn: getText("hvangioayn"),
        hventiayn: getText("hventiayn"),
        phpid: getText("phpid"),
        lastUpdate: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        wgs84Lat: lat !== 0 ? lat : undefined,
        wgs84Lon: lon !== 0 ? lon : undefined
      });
    }

    return result;
  } catch (e) {
    console.error("XML Parsing Error", e);
    return [];
  }
};

/**
 * Parses the XML response from the Hospital List API (getEgytListInfoInqire).
 * Returns a Map of hpid -> { lat, lon }
 */
export const parseHospitalListXml = (xmlText: string): Map<string, { lat: number, lon: number }> => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");
    const result = new Map<string, { lat: number, lon: number }>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const hpid = item.getElementsByTagName("hpid")[0]?.textContent;
      const latStr = item.getElementsByTagName("wgs84Lat")[0]?.textContent;
      const lonStr = item.getElementsByTagName("wgs84Lon")[0]?.textContent;

      if (hpid && latStr && lonStr) {
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          result.set(hpid, { lat, lon });
        }
      }
    }
    return result;
  } catch (e) {
    console.error("XML List Parsing Error", e);
    return new Map();
  }
};