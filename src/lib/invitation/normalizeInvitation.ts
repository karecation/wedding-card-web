import {
  defaultMenuOrder,
  emptyInvitationData,
  type BankAccountItem,
  type GalleryImage,
  type InvitationData,
  type MenuSectionId,
  type MenuOrderItem,
  type TransportItem,
} from "@/types/invitation";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { resolveIntroLayout, type IntroLayoutId } from "@/lib/invitation/introLayouts";

export type NormalizedInvitation = {
  id?: string;
  slug?: string;
  isPublished: boolean;
  basic: {
    groomName: string;
    brideName: string;
    weddingDate: string;
    weddingTime: string;
    weddingDay?: string;
    venueName: string;
    venueHall?: string;
    venueAddress: string;
  };
  design: {
    theme: string;
    themeColor: "ivory" | "beige" | "pink";
    accentColor: string;
    fontFamily: string;
    fontWeight: "light" | "regular" | "medium";
    introLayout: IntroLayoutId;
    frameStyle: "default" | "arch" | "ellipse" | "frame" | "fill";
    visualEffect: "none" | "wave" | "fog";
    particleEffect: "none" | "heart" | "snow" | "sakura" | "ginkgo";
    preventZoom: boolean;
    revealOnScroll: boolean;
  };
  intro: {
    mainImageUrl?: string;
    mainImagePreviewUrl?: string;
    headline: string;
    subText: string;
  };
  greeting: {
    label: string;
    title: string;
    body: string;
  };
  calendar: {
    enabled: boolean;
  };
  location: {
    enabled: boolean;
    title: string;
    venueName: string;
    hallName?: string;
    hall?: string;
    address: string;
    lat?: number;
    lng?: number;
    showMap: boolean;
    lockMap: boolean;
    transportations: Array<{
      id: string;
      type: "subway" | "bus" | "car";
      title: string;
      body: string;
    }>;
  };
  gallery: {
    enabled: boolean;
    title: string;
    type: "slide" | "grid" | "masonry";
    showArrows: boolean;
    images: Array<{
      id: string;
      url?: string;
      previewUrl?: string;
      dataUrl?: string;
      caption?: string;
      order: number;
    }>;
  };
  video: {
    enabled: boolean;
    youtubeUrl: string;
    youtubeVideoId: string;
    videoUrl: string;
  };
  audio: {
    enabled: boolean;
    url: string;
    title: string;
    autoplay: boolean;
  };
  quote: {
    enabled: boolean;
    imageUrl: string;
    text: string;
  };
  notice: {
    enabled: boolean;
    groupTitle: string;
    groupBody: string;
    separateTitle: string;
    separateBody: string;
  };
  rsvp: {
    enabled: boolean;
    title: string;
    body: string;
    buttonText: string;
    collectMeal: boolean;
    collectPhoneLast4: boolean;
    collectCompanions: boolean;
    collectMessage: boolean;
  };
  contacts: {
    enabled: boolean;
    groomPhone?: string;
    bridePhone?: string;
    groomFatherPhone?: string;
    groomMotherPhone?: string;
    brideFatherPhone?: string;
    brideMotherPhone?: string;
  };
  accounts: {
    enabled: boolean;
    title: string;
    groups: Array<{
      id: string;
      side: "groom" | "bride";
      groupName: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      kakaoPayEnabled?: boolean;
      hidden?: boolean;
    }>;
  };
  guestbook: {
    enabled: boolean;
    title: string;
    adminPassword?: string;
  };
  share: {
    title: string;
    description: string;
    kakaoThumbnailUrl?: string;
    urlThumbnailUrl?: string;
  };
  menuOrder: MenuSectionId[];
};

const sectionDefaults: Record<MenuSectionId, boolean> = {
  intro: true,
  greeting: true,
  calendar: true,
  gallery: true,
  video: true,
  location: true,
  notice: true,
  rsvp: true,
  accounts: true,
  guestbook: true,
  quote: true,
};

const koPeriodMap: Record<string, string> = {
  "?ㅼ쟾": "오전",
  "?ㅽ썑": "오후",
};

const fontMap: Record<string, string> = {
  고운고딕: "gowun-dodum",
  "怨좎슫怨좊뵓": "gowun-dodum",
  고운바탕: "gowun-batang",
  노토세리프: "noto-serif",
  프리텐다드: "pretendard",
  나눔명조: "nanum-myeongjo",
  "紐낆“": "nanum-myeongjo",
  "?꾨━?먮떎??": "pretendard",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function menuEnabled(menu: MenuOrderItem[] | undefined, id: MenuSectionId, fallback = true) {
  return menu?.find((item) => item.id === id)?.enabled ?? fallback;
}

function normalizeMenuOrder(value: unknown): MenuSectionId[] {
  const source = Array.isArray(value) ? value : defaultMenuOrder;
  const ids = source
    .map((item) => (typeof item === "string" ? item : asRecord(item).id))
    .filter((id): id is MenuSectionId => typeof id === "string" && id in sectionDefaults);
  const missing = defaultMenuOrder.map((item) => item.id).filter((id) => !ids.includes(id));
  return [...ids, ...missing];
}

/** accent hex → background token 매핑 */
const ACCENT_TO_TOKEN: Record<string, "ivory" | "beige" | "pink"> = {
  // 기본 3색
  "#c9897a": "ivory",
  "#b78f72": "beige",
  "#d8a0a6": "pink",
  // 추가 테마 프리셋
  "#a8a090": "ivory",   // natural
  "#8a7a6a": "beige",   // classic
};

function normalizeThemeColor(value: string): NormalizedInvitation["design"]["themeColor"] {
  const v = (value ?? "").trim().toLowerCase();
  // 1. named
  if (v === "pink") return "pink";
  if (v === "beige") return "beige";
  if (v === "ivory") return "ivory";
  // 2. known hex exact match
  const exact = ACCENT_TO_TOKEN[v];
  if (exact) return exact;
  // 3. hex-based heuristic (r,g,b 분석)
  if (v.startsWith("#") && v.length === 7) {
    const r = parseInt(v.slice(1, 3), 16);
    const g = parseInt(v.slice(3, 5), 16);
    const b = parseInt(v.slice(5, 7), 16);
    if (b > 130 && b > g * 0.88) return "pink";   // 파란 기운 있는 핑크
    if (r > g && g > b) return "beige";             // 따뜻한 갈색 계열
  }
  // 4. legacy string patterns
  if (v.includes("pink") || v.includes("f06") || v.includes("e8d")) return "pink";
  if (v.includes("beige")) return "beige";
  return "ivory";
}

function normalizeFont(value: string) {
  return fontMap[value] ?? value ?? "gowun-dodum";
}

function normalizeWeight(value: string): "light" | "regular" | "medium" {
  if (value === "light" || value.includes("얇") || value.includes("?뉕")) return "light";
  if (value === "medium" || value.includes("굵") || value.includes("援")) return "medium";
  return "regular";
}

function normalizeFrame(value: string): NormalizedInvitation["design"]["frameStyle"] {
  if (value === "arch" || value.includes("아치")) return "arch";
  if (value === "ellipse" || value.includes("타원")) return "ellipse";
  if (value === "frame" || value.includes("액자")) return "frame";
  if (value === "fill" || value.includes("채우기")) return "fill";
  return "default";
}

function normalizeEffect(value: string): "none" | "wave" | "fog" {
  if (value === "wave" || value.includes("물결")) return "wave";
  if (value === "fog" || value.includes("안개")) return "fog";
  return "none";
}

function normalizeParticle(value: string): NormalizedInvitation["design"]["particleEffect"] {
  if (value === "heart" || value.includes("하트")) return "heart";
  if (value === "snow" || value.includes("눈")) return "snow";
  if (value === "sakura" || value.includes("벚꽃")) return "sakura";
  if (value === "ginkgo" || value.includes("은행")) return "ginkgo";
  if (value.includes("꽃잎") || value.includes("벚")) return "sakura";
  return "none";
}

function normalizeIntroLayout(value: string): NormalizedInvitation["design"]["introLayout"] {
  return resolveIntroLayout(value);
}

function normalizeTransport(items: TransportItem[]) {
  return items.map((item, index) => {
    const type: "subway" | "bus" | "car" =
      item.id === "bus" || item.title.includes("버스")
        ? "bus"
        : item.id === "car" || item.title.includes("자가")
          ? "car"
          : "subway";

    return {
      id: item.id || `transport-${index}`,
      type,
      title: item.title,
      body: item.description,
    };
  });
}

function normalizeGallery(items: GalleryImage[], images: string[]) {
  const fromItems = items.map((item, index) => ({
    id: item.id || `gallery-${index}`,
    url: item.url,
    previewUrl: item.previewUrl || item.dataUrl || item.url,
    dataUrl: item.dataUrl,
    caption: item.caption,
    order: item.order ?? index,
  }));
  const fromUrls = images
    .filter((url) => !fromItems.some((item) => item.url === url || item.dataUrl === url || item.previewUrl === url))
    .map((url, index) => ({ id: `gallery-url-${index}`, url, previewUrl: url, dataUrl: undefined, order: fromItems.length + index }));
  const seen = new Set<string>();
  return [...fromItems, ...fromUrls]
    .filter((item) => item.url || item.dataUrl || item.previewUrl)
    .filter((item) => {
      const key = item.id || item.url || item.dataUrl || item.previewUrl || "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, id: item.id || `gallery-${index}`, order: index }));
}

function normalizeGalleryType(value: string): "slide" | "grid" | "masonry" {
  if (value === "slide" || value.includes("슬라이드")) return "slide";
  if (value === "masonry" || value.includes("바둑판")) return "masonry";
  return "grid";
}

function getContactPhone(contacts: unknown, id: string) {
  if (Array.isArray(contacts)) {
    return contacts.find((contact) => asRecord(contact).id === id)?.phone || undefined;
  }

  const contactMap = asRecord(contacts);
  const directPhone = asString(contactMap[id]);
  if (directPhone) return directPhone;

  const normalizedKeyById: Record<string, string> = {
    groom: "groomPhone",
    bride: "bridePhone",
    "groom-father": "groomFatherPhone",
    "groom-mother": "groomMotherPhone",
    "bride-father": "brideFatherPhone",
    "bride-mother": "brideMotherPhone",
  };

  return asString(contactMap[normalizedKeyById[id]]) || undefined;
}

export function normalizeInvitation(raw: unknown): NormalizedInvitation {
  const row = asRecord(raw);
  const settings = asRecord(row.settings);
  const merged = {
    ...emptyInvitationData,
    ...settings,
    ...row,
  } as InvitationData & Record<string, unknown>;

  const theme = asRecord(row.theme);
  const groom = asRecord(row.groom);
  const bride = asRecord(row.bride);
  const greeting = asRecord(row.greeting);
  const venue = asRecord(row.venue);
  const location = asRecord(merged.location);

  const menu = Array.isArray(merged.menuOrder) ? (merged.menuOrder as MenuOrderItem[]) : defaultMenuOrder;
  const groomName =
    asString(merged.groomName) ||
    asString(groom.name) ||
    `${asString(merged.groomLastName)}${asString(merged.groomFirstName)}` ||
    emptyInvitationData.groomName;
  const brideName =
    asString(merged.brideName) ||
    asString(bride.name) ||
    `${asString(merged.brideLastName)}${asString(merged.brideFirstName)}` ||
    emptyInvitationData.brideName;
  const period = koPeriodMap[merged.weddingPeriod] ?? merged.weddingPeriod ?? "오후";
  const time = asString(row.wedding_time) || asString(merged.weddingTime) || `${period} ${merged.weddingHour} ${merged.weddingMinute}`;
  const venueName =
    asString(location.venueName) ||
    asString(location.venue) ||
    asString(location.locationName) ||
    asString(merged.venueName) ||
    asString(venue.name) ||
    emptyInvitationData.venueName;
  const venueHall = asString(location.hallName) || asString(location.hall) || asString(merged.venueHall) || asString(venue.hall);
  const venueAddress =
    asString(location.address) ||
    asString(location.placeAddress) ||
    asString(location.mapAddress) ||
    asString(merged.venueAddress) ||
    asString(venue.address);
  const locationLat = asNumber(location.lat) ?? asNumber(location.latitude) ?? asNumber(merged.latitude) ?? asNumber(venue.latitude);
  const locationLng = asNumber(location.lng) ?? asNumber(location.longitude) ?? asNumber(merged.longitude) ?? asNumber(venue.longitude);
  const transportTitle = asString(location.transportTitle);
  const transportDescription = asString(location.transportDescription);
  const youtubeUrl = asString(merged.youtubeUrl);
  const youtubeVideoId = asString(merged.youtubeVideoId) || extractYouTubeVideoId(youtubeUrl);
  const videoUrl = asString((merged as Record<string, unknown>).videoUrl);
  const locationTransports: TransportItem[] =
    Array.isArray(merged.transports) && merged.transports.length > 0
      ? (merged.transports as TransportItem[])
      : transportTitle || transportDescription
        ? [{ id: "location-transport", title: transportTitle, description: transportDescription }]
        : [];
  const rawGallery = asRecord(merged.gallery);
  const galleryStateImages = Array.isArray(rawGallery.images) ? (rawGallery.images as GalleryImage[]) : [];
  const gallerySourceItems = galleryStateImages.length > 0 ? galleryStateImages : merged.galleryItems ?? [];
  const gallerySourceUrls = galleryStateImages.length > 0 ? [] : merged.galleryImages ?? [];
  const galleryImages = normalizeGallery(gallerySourceItems, gallerySourceUrls);
  const accounts = (merged.bankAccounts ?? []) as BankAccountItem[];
  const locationEnabled = menuEnabled(menu, "location", true);
  const accountsEnabled = menuEnabled(menu, "accounts", true);
  const rsvpEnabled = menuEnabled(menu, "rsvp", true);
  const guestbookEnabled = menuEnabled(menu, "guestbook", true);

  return {
    id: asString(merged.id),
    slug: asString(merged.slug),
    isPublished: asBoolean(merged.isPublished, asBoolean(row.is_published, true)),
    basic: {
      groomName,
      brideName,
      weddingDate: asString(row.wedding_date) || asString(merged.weddingDate, emptyInvitationData.weddingDate),
      weddingTime: time,
      venueName,
      venueHall,
      venueAddress,
    },
    design: {
      theme: asString(merged.templateMood) || asString(theme.templateMood, "모던"),
      themeColor: normalizeThemeColor(asString(merged.themeColor) || asString(theme.themeColor)),
      accentColor: asString(merged.themeColor) || asString(theme.themeColor, "#c9897a"),
      fontFamily: normalizeFont(asString(merged.fontFamily) || asString(theme.fontFamily, "gowun-dodum")),
      fontWeight: normalizeWeight(asString(merged.fontWeight) || asString(theme.fontWeight)),
      // introTemplate 우선, 없으면 templateMood를 layout key로 해석한다.
      introLayout: normalizeIntroLayout(asString(merged.introTemplate) || asString(merged.templateMood)),
      frameStyle: normalizeFrame(asString(merged.introShape) || asString(theme.introShape)),
      visualEffect: "none",
      particleEffect: "none",
      preventZoom: asBoolean(merged.preventZoom, true),
      revealOnScroll: asBoolean(merged.scrollEffect, true),
    },
    intro: {
      mainImageUrl: asString(merged.coverImage) || asString(merged.introImage) || asString(row.main_image_url),
      mainImagePreviewUrl: asString(merged.coverImage) || asString(merged.introImage) || asString(row.main_image_url),
      headline: asString(merged.introHeadline, "We're getting married"),
      subText: asString(merged.introSubText, "Save The Date"),
    },
    greeting: {
      label: "INVITATION",
      title: asString(merged.messageTitle) || asString(greeting.title, emptyInvitationData.messageTitle),
      body: asString(merged.message) || asString(greeting.message, emptyInvitationData.message),
    },
    calendar: {
      enabled: asBoolean(merged.showCalendar, true) && menuEnabled(menu, "calendar", true),
    },
    location: {
      enabled: locationEnabled,
      title: asString(merged.venueTitle) || asString(venue.title, "오시는 길"),
      venueName,
      hallName: venueHall,
      hall: venueHall,
      address: venueAddress,
      lat: locationLat,
      lng: locationLng,
      showMap: asBoolean(merged.showMap, true),
      lockMap: asBoolean(merged.lockMap, false),
      transportations: normalizeTransport(locationTransports),
    },
    gallery: {
      enabled: asBoolean(rawGallery.enabled, menuEnabled(menu, "gallery", true)) || galleryImages.length > 0,
      title: asString(rawGallery.title) || asString(merged.galleryTitle, "갤러리"),
      type: normalizeGalleryType(asString(rawGallery.type) || asString(merged.galleryType, "grid")),
      showArrows: asBoolean(rawGallery.showArrows, asBoolean(merged.showGalleryArrows, false)),
      images: galleryImages,
    },
    video: {
      enabled: menuEnabled(menu, "video", true),
      youtubeUrl,
      youtubeVideoId,
      videoUrl,
    },
    audio: {
      enabled: Boolean(merged.audioUrl),
      url: asString(merged.audioUrl),
      title: asString(merged.audioTitle),
      autoplay: asBoolean(merged.audioAutoplay, true),
    },
    quote: {
      enabled: menuEnabled(menu, "quote", true),
      imageUrl: asString(merged.quoteImage),
      text: asString(merged.quoteText),
    },
    notice: {
      enabled: menuEnabled(menu, "notice", true),
      groupTitle: asString(merged.noticeGroupTitle, "안내사항"),
      groupBody: asString(merged.noticeGroupBody),
      separateTitle: asString(merged.noticeSeparateTitle, "안내사항"),
      separateBody: asString(merged.noticeSeparateBody),
    },
    rsvp: {
      enabled: rsvpEnabled,
      title: asString(merged.rsvpTitle, emptyInvitationData.rsvpTitle),
      body: asString(merged.rsvpDescription, emptyInvitationData.rsvpDescription),
      buttonText: asString(merged.rsvpButtonLabel, emptyInvitationData.rsvpButtonLabel),
      collectMeal: true,
      collectPhoneLast4: true,
      collectCompanions: true,
      collectMessage: true,
    },
    contacts: {
      enabled: menuEnabled(menu, "notice", true),
      groomPhone: getContactPhone(merged.contacts, "groom"),
      bridePhone: getContactPhone(merged.contacts, "bride"),
      groomFatherPhone: getContactPhone(merged.contacts, "groom-father"),
      groomMotherPhone: getContactPhone(merged.contacts, "groom-mother"),
      brideFatherPhone: getContactPhone(merged.contacts, "bride-father"),
      brideMotherPhone: getContactPhone(merged.contacts, "bride-mother"),
    },
    accounts: {
      enabled: accountsEnabled,
      title: "마음 전하실 곳",
      groups: accounts.map((account) => ({
        id: account.id,
        side: account.side,
        groupName: account.groupName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        kakaoPayEnabled: account.kakaoPayEnabled,
        hidden: account.hidden,
      })),
    },
    guestbook: {
      enabled: guestbookEnabled,
      title: asString(merged.guestbookTitle, "방명록"),
      adminPassword: asString(merged.guestbookAdminPassword),
    },
    share: {
      title: asString(merged.kakaoShareTitle, "결혼합니다"),
      description: asString(merged.kakaoShareDescription, "소중한 분들을 초대합니다."),
      kakaoThumbnailUrl: asString(merged.kakaoThumbnailUrl) || asString(row.kakao_thumbnail_url),
      urlThumbnailUrl: asString(merged.urlThumbnailUrl) || asString(row.url_thumbnail_url),
    },
    menuOrder: normalizeMenuOrder(merged.menuOrder),
  };
}
