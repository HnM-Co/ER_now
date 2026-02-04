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