"use client";

import { useEffect, useRef, useState } from "react";

type KakaoMapProps = {
  venueName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  height?: number | string;
};

type KakaoGeocodeResult = {
  x: string;
  y: string;
};

type KakaoLatLng = object;
type KakaoMapInstance = object;

type KakaoMaps = {
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

function loadKakaoMaps(appKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("window unavailable"));
  if (window.kakao?.maps?.services) return Promise.resolve();
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const loadMaps = () => {
      if (!window.kakao?.maps?.load) {
        reject(new Error("kakao maps sdk unavailable"));
        return;
      }
      window.kakao.maps.load(() => {
        console.log("[KakaoMap script loaded]");
        resolve();
      });
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function KakaoMap({ venueName, address, lat, lng, height = 260 }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  const hasAppKey = Boolean(appKey);
  const hasCoords = isFiniteNumber(lat) && isFiniteNumber(lng);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    console.log("[KakaoMap env]", { hasAppKey });
  }, [hasAppKey]);

  useEffect(() => {
    console.log("[KakaoMap props]", { venueName, address, lat, lng });
  }, [venueName, address, lat, lng]);

  useEffect(() => {
    let cancelled = false;

    const renderMap = (mapLat: number, mapLng: number) => {
      if (cancelled || !containerRef.current || !window.kakao?.maps) return;
      console.log("[KakaoMap render map]", { lat: mapLat, lng: mapLng });
      const kakao = window.kakao.maps;
      const center = new kakao.LatLng(mapLat, mapLng);
      const map = new kakao.Map(containerRef.current, { center, level: 3 });
      const marker = new kakao.Marker({ position: center });
      marker.setMap(map);
      setFallbackReason(null);
    };

    const showFallback = (reason: string) => {
      if (cancelled) return;
      console.log("[KakaoMap fallback]", { reason });
      setFallbackReason(reason);
    };

    if (!hasAppKey || !appKey) {
      showFallback("missing app key");
      return;
    }

    if (!hasCoords && !address?.trim()) {
      showFallback("missing address");
      return;
    }

    loadKakaoMaps(appKey)
      .then(() => {
        if (cancelled) return;
        if (hasCoords) {
          renderMap(lat, lng);
          return;
        }

        const cleanAddress = address?.trim();
        if (!cleanAddress || !window.kakao?.maps?.services) {
          showFallback("missing address");
          return;
        }

        console.log("[KakaoMap geocode start]", { address: cleanAddress });
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(cleanAddress, (result, status) => {
          if (cancelled) return;
          if (status === window.kakao?.maps.services.Status.OK && result[0]) {
            const nextLat = Number(result[0].y);
            const nextLng = Number(result[0].x);
            console.log("[KakaoMap geocode success]", { lat: nextLat, lng: nextLng });
            renderMap(nextLat, nextLng);
            return;
          }

          console.log("[KakaoMap geocode failed]", { status });
          showFallback("geocode failed");
        });
      })
      .catch((error) => {
        showFallback(error instanceof Error ? error.message : "script load failed");
      });

    return () => {
      cancelled = true;
    };
  }, [address, appKey, hasAppKey, hasCoords, lat, lng]);

  const style = { height: typeof height === "number" ? `${height}px` : height };

  if (!hasAppKey || (!hasCoords && !address?.trim())) {
    const reason = !hasAppKey ? "missing app key" : "missing address";
    console.log("[KakaoMap fallback]", { reason });
    return (
      <div className="grid w-full place-items-center px-6 text-center text-[12px] leading-6 text-[#9d8a80]" style={style}>
        {!hasCoords && !address?.trim() ? "주소를 입력하면 지도가 표시됩니다." : "지도를 불러올 수 없습니다. 카카오 지도 API 키 또는 주소를 확인해주세요."}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={style}>
      <div ref={containerRef} className="h-full w-full" aria-label={venueName ? `${venueName} 지도` : "예식장 지도"} />
      {fallbackReason && (
        <div className="absolute inset-0 grid place-items-center bg-[#f1eee9] px-6 text-center text-[12px] leading-6 text-[#9d8a80]">
          지도를 불러올 수 없습니다. 카카오 지도 API 키 또는 주소를 확인해주세요.
        </div>
      )}
    </div>
  );
}
