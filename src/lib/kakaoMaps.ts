"use client";

export type KakaoGeocodeResult = {
  x: string; // lng
  y: string; // lat
  address_name?: string;
  road_address?: { address_name?: string } | null;
};

export type KakaoPlaceResult = {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string; // lng
  y: string; // lat
  category_name?: string;
};

type KakaoLatLng = object;
type KakaoMapInstance = object;

export type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance }) => { setMap: (map: KakaoMapInstance) => void };
  services: {
    Status: { OK: string };
    Geocoder: new () => {
      addressSearch: (address: string, callback: (result: KakaoGeocodeResult[], status: string) => void) => void;
    };
    Places: new () => {
      keywordSearch: (
        keyword: string,
        callback: (result: KakaoPlaceResult[], status: string) => void,
        options?: { size?: number },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMaps;
    };
  }
}

const SCRIPT_ID = "kakao-maps-sdk";
let kakaoMapsPromise: Promise<void> | null = null;

export function getKakaoMapAppKey() {
  return process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";
}

export function loadKakaoMaps(appKey = getKakaoMapAppKey()) {
  if (typeof window === "undefined") return Promise.reject(new Error("window unavailable"));
  if (!appKey) return Promise.reject(new Error("missing app key"));
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const loadMaps = () => {
      if (!window.kakao?.maps?.load) {
        reject(new Error("kakao maps sdk unavailable"));
        return;
      }
      window.kakao.maps.load(resolve);
    };

    if (existingScript) {
      if (window.kakao?.maps?.load) loadMaps();
      else {
        existingScript.addEventListener("load", loadMaps, { once: true });
        existingScript.addEventListener("error", () => reject(new Error("kakao maps script failed")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.onload = loadMaps;
    script.onerror = () => reject(new Error("kakao maps script failed"));
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}

/** 도로명/지번 주소로 좌표 검색 */
export async function geocodeKakaoAddress(address: string): Promise<{ lat: number; lng: number }> {
  const cleanAddress = address.trim();
  if (!cleanAddress) throw new Error("주소를 입력 후 [검색]을 눌러주세요.");

  await loadKakaoMaps();

  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!window.kakao?.maps?.services) {
      reject(new Error("카카오 지도 서비스를 불러오지 못했습니다."));
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(cleanAddress, (result, status) => {
      if (status === window.kakao?.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
        return;
      }
      reject(new Error("ADDRESS_NOT_FOUND"));
    });
  });
}

/** 장소명으로 검색 (keywordSearch) */
export async function keywordSearchKakao(keyword: string): Promise<KakaoPlaceResult[]> {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) throw new Error("검색어를 입력해 주세요.");

  await loadKakaoMaps();

  return new Promise<KakaoPlaceResult[]>((resolve, reject) => {
    if (!window.kakao?.maps?.services?.Places) {
      reject(new Error("카카오 장소 검색 서비스를 불러오지 못했습니다."));
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(
      cleanKeyword,
      (result, status) => {
        if (status === window.kakao?.maps.services.Status.OK && result.length > 0) {
          resolve(result);
          return;
        }
        reject(new Error("KEYWORD_NOT_FOUND"));
      },
      { size: 5 },
    );
  });
}

export type LocationSearchResult = {
  placeName: string;
  roadAddress: string;
  jibunAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
};

/**
 * 주소 검색 통합:
 * 1. addressSearch(도로명/지번) 시도
 * 2. 실패 시 keywordSearch(장소명) fallback
 * - 단건이면 즉시 resolve
 * - 복수 결과면 목록으로 resolve
 */
export async function searchKakaoLocation(query: string): Promise<{
  single?: LocationSearchResult;
  multiple?: LocationSearchResult[];
}> {
  const clean = query.trim();
  if (!clean) throw new Error("주소를 입력 후 [검색]을 눌러주세요.");

  // 1. 도로명/지번 주소 검색
  try {
    const { lat, lng } = await geocodeKakaoAddress(clean);
    return {
      single: {
        placeName: "",
        roadAddress: clean,
        jibunAddress: clean,
        lat,
        lng,
      },
    };
  } catch (geocodeErr) {
    const msg = geocodeErr instanceof Error ? geocodeErr.message : "";
    // 주소 형식이 맞지 않으면 keyword fallback
    if (msg !== "ADDRESS_NOT_FOUND" && !msg.includes("NOT_FOUND")) throw geocodeErr;
  }

  // 2. 장소명(keyword) 검색 fallback
  const places = await keywordSearchKakao(clean).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("NOT_FOUND") || msg.includes("KEYWORD_NOT_FOUND")) {
      throw new Error(
        `검색 결과가 없습니다. 도로명 주소로 다시 입력해 주세요.\n예: 서울 서초구 강남대로107길 6`,
      );
    }
    throw err;
  });

  if (places.length === 0) {
    throw new Error(`검색 결과가 없습니다. 도로명 주소로 다시 입력해 주세요.\n예: 서울 서초구 강남대로107길 6`);
  }

  const toResult = (p: KakaoPlaceResult): LocationSearchResult => ({
    placeName: p.place_name,
    roadAddress: p.road_address_name,
    jibunAddress: p.address_name,
    lat: Number(p.y),
    lng: Number(p.x),
    placeId: p.id,
  });

  if (places.length === 1) {
    return { single: toResult(places[0]) };
  }

  return { multiple: places.map(toResult) };
}
