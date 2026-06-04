"use client";

export type KakaoGeocodeResult = {
  x: string;
  y: string;
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

export async function geocodeKakaoAddress(address: string) {
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
      reject(new Error("주소 검색 결과가 없습니다."));
    });
  });
}
