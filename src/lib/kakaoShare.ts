"use client";

export type KakaoSharePayload = {
  title: string;
  description: string;
  imageUrl?: string;
  webUrl: string;
};

type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share?: {
    sendDefault: (payload: unknown) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_SHARE_SCRIPT_ID = "kakao-share-sdk";
const KAKAO_SHARE_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";

let kakaoShareSdkPromise: Promise<KakaoSdk> | null = null;

export function getKakaoJavaScriptKey() {
  return (
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ||
    process.env.VITE_KAKAO_JS_KEY ||
    ""
  );
}

function getKakaoSdk() {
  if (typeof window === "undefined") return undefined;
  return window.Kakao;
}

export function loadKakaoShareSdk(appKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("browser required"));
  }

  const existingSdk = getKakaoSdk();
  if (existingSdk) {
    if (!existingSdk.isInitialized()) existingSdk.init(appKey);
    return Promise.resolve(existingSdk);
  }

  if (kakaoShareSdkPromise) return kakaoShareSdkPromise;

  kakaoShareSdkPromise = new Promise<KakaoSdk>((resolve, reject) => {
    const initSdk = () => {
      const sdk = getKakaoSdk();
      if (!sdk) {
        reject(new Error("Kakao JavaScript SDK를 불러오지 못했습니다."));
        return;
      }

      if (!sdk.isInitialized()) sdk.init(appKey);
      resolve(sdk);
    };

    const existingScript = document.getElementById(KAKAO_SHARE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", initSdk, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Kakao JavaScript SDK 로드에 실패했습니다.")), { once: true });
      initSdk();
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SHARE_SCRIPT_ID;
    script.src = KAKAO_SHARE_SDK_URL;
    script.async = true;
    script.onload = initSdk;
    script.onerror = () => reject(new Error("Kakao JavaScript SDK 로드에 실패했습니다."));
    document.head.appendChild(script);
  });

  return kakaoShareSdkPromise;
}

export async function initializeKakaoShareSdk() {
  const appKey = getKakaoJavaScriptKey();
  if (!appKey) return { ok: false, reason: "missing-app-key" as const };

  try {
    await loadKakaoShareSdk(appKey);
    return { ok: true, reason: "" as const };
  } catch (error) {
    console.warn("[KakaoShare init failed]", { message: error instanceof Error ? error.message : String(error) });
    return { ok: false, reason: "sdk-load-failed" as const };
  }
}

export async function sendKakaoInvitationShare(payload: KakaoSharePayload) {
  const appKey = getKakaoJavaScriptKey();
  if (!appKey) throw new Error("카카오 JavaScript 키가 설정되어 있지 않습니다.");

  const sdk = await loadKakaoShareSdk(appKey);
  if (!sdk.isInitialized()) throw new Error("카카오 JavaScript SDK가 초기화되지 않았습니다.");
  if (!sdk.Share?.sendDefault) throw new Error("카카오 공유 기능을 사용할 수 없습니다.");

  sdk.Share.sendDefault({
    objectType: "feed",
    content: {
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl || "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png",
      link: {
        mobileWebUrl: payload.webUrl,
        webUrl: payload.webUrl,
      },
    },
    buttons: [
      {
        title: "청첩장 보기",
        link: {
          mobileWebUrl: payload.webUrl,
          webUrl: payload.webUrl,
        },
      },
    ],
  });
}
