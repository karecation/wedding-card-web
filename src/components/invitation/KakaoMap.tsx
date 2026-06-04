"use client";

import { useEffect, useRef, useState } from "react";
import { getKakaoMapAppKey, loadKakaoMaps } from "@/lib/kakaoMaps";

type KakaoMapProps = {
  venueName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  height?: number | string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function KakaoMap({ venueName, address, lat, lng, height = 260 }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appKey = getKakaoMapAppKey();
  const hasAppKey = Boolean(appKey);
  const hasCoords = isFiniteNumber(lat) && isFiniteNumber(lng);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timerStarted = false;

    const endTimer = () => {
      if (!timerStarted) return;
      console.timeEnd("[KAKAO_MAP_LOAD]");
      timerStarted = false;
    };

    const renderMap = (mapLat: number, mapLng: number) => {
      if (cancelled || !containerRef.current || !window.kakao?.maps) return;
      const kakao = window.kakao.maps;
      const center = new kakao.LatLng(mapLat, mapLng);
      const map = new kakao.Map(containerRef.current, { center, level: 3 });
      const marker = new kakao.Marker({ position: center });
      marker.setMap(map);
      setFallbackReason(null);
      setIsLoading(false);
      endTimer();
    };

    const showFallback = (reason: string) => {
      if (cancelled) return;
      setFallbackReason(reason);
      setIsLoading(false);
      endTimer();
    };

    if (!hasAppKey || !appKey) {
      showFallback("missing app key");
      return;
    }

    if (!hasCoords && !address?.trim()) {
      showFallback("missing address");
      return;
    }

    console.time("[KAKAO_MAP_LOAD]");
    timerStarted = true;
    setIsLoading(true);
    setFallbackReason(null);

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

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(cleanAddress, (result, status) => {
          if (cancelled) return;
          if (status === window.kakao?.maps.services.Status.OK && result[0]) {
            const nextLat = Number(result[0].y);
            const nextLng = Number(result[0].x);
            renderMap(nextLat, nextLng);
            return;
          }

          showFallback("geocode failed");
        });
      })
      .catch((error) => {
        showFallback(error instanceof Error ? error.message : "script load failed");
      });

    return () => {
      cancelled = true;
      endTimer();
    };
  }, [address, appKey, hasAppKey, hasCoords, lat, lng]);

  const style = { height: typeof height === "number" ? `${height}px` : height };

  if (!hasAppKey || (!hasCoords && !address?.trim())) {
    return (
      <div className="grid w-full place-items-center px-6 text-center text-[12px] leading-6 text-[#9d8a80]" style={style}>
        {!hasCoords && !address?.trim()
          ? "주소를 입력하면 지도가 표시됩니다."
          : "지도를 불러올 수 없습니다. 카카오 지도 API 키 또는 주소를 확인해주세요."}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={style}>
      <div ref={containerRef} className="h-full w-full" aria-label={venueName ? `${venueName} 지도` : "예식장 지도"} />
      {isLoading && !fallbackReason && (
        <div className="absolute inset-0 grid place-items-center bg-[#f1eee9] px-6 text-center text-[12px] leading-6 text-[#9d8a80]">
          지도 불러오는 중
        </div>
      )}
      {fallbackReason && (
        <div className="absolute inset-0 grid place-items-center bg-[#f1eee9] px-6 text-center text-[12px] leading-6 text-[#9d8a80]">
          지도를 불러올 수 없습니다. 카카오 지도 API 키 또는 주소를 확인해주세요.
        </div>
      )}
    </div>
  );
}
