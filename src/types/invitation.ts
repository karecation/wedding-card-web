export type TemplateMood = "모던 NEW" | "고운고딕" | "클래식" | "로맨틱" | "내추럴";
export type IntroShape = "기본" | "아치" | "타원" | "액자" | "채우기";
export type GalleryType = "슬라이드" | "바둑판" | "그리드";
export type ImageUploadType = "main" | "intro" | "gallery" | "quote" | "kakao_thumbnail" | "url_thumbnail";

export type MenuSectionId =
  | "intro"
  | "greeting"
  | "calendar"
  | "gallery"
  | "video"
  | "location"
  | "notice"
  | "rsvp"
  | "accounts"
  | "guestbook"
  | "quote";

export type MenuOrderItem = {
  id: MenuSectionId;
  label: string;
  enabled: boolean;
};

export type TransportItem = {
  id: string;
  title: string;
  description: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  caption?: string;
  type?: ImageUploadType;
};

export type ContactItem = {
  id: string;
  role: string;
  name: string;
  phone: string;
};

export type BankAccountItem = {
  id: string;
  side: "groom" | "bride";
  groupName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  kakaoPayEnabled: boolean;
  hidden: boolean;
};

export type InvitationData = {
  id?: string;
  slug?: string;
  isPublished: boolean;
  coverImage: string;
  introImage: string;
  galleryImages: string[];
  galleryItems: GalleryImage[];
  quoteImage: string;
  quoteText: string;
  kakaoThumbnailUrl: string;
  urlThumbnailUrl: string;
  groomName: string;
  brideName: string;
  groomFatherLastName: string;
  groomFatherName: string;
  groomMotherLastName: string;
  groomMotherName: string;
  groomLastName: string;
  groomFirstName: string;
  groomRelation: string;
  groomFatherDeceased: boolean;
  groomMotherDeceased: boolean;
  brideFatherLastName: string;
  brideFatherName: string;
  brideMotherLastName: string;
  brideMotherName: string;
  brideLastName: string;
  brideFirstName: string;
  brideRelation: string;
  brideFatherDeceased: boolean;
  brideMotherDeceased: boolean;
  brideFirstDisplay: boolean;
  messageTitle: string;
  message: string;
  weddingDate: string;
  weddingPeriod: "오전" | "오후";
  weddingHour: string;
  weddingMinute: string;
  weddingTime: string;
  showCalendar: boolean;
  showDday: boolean;
  showCountdown: boolean;
  venueTitle: string;
  venueName: string;
  venueHall: string;
  venueAddress: string;
  latitude: number | null;
  longitude: number | null;
  mapLink: string;
  showMap: boolean;
  lockMap: boolean;
  attachMap: boolean;
  showTransportIcons: boolean;
  transports: TransportItem[];
  galleryTitle: string;
  galleryType: GalleryType;
  showGalleryArrows: boolean;
  contacts: ContactItem[];
  bankAccounts: BankAccountItem[];
  groomAccount: string;
  brideAccount: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  youtubeError: string;
  musicUrl: string;
  audioUrl: string;
  audioTitle: string;
  defaultMusic: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  audioAutoplay: boolean;
  templateMood: TemplateMood;
  themeColor: string;
  fontFamily: "고운고딕" | "명조" | "프리텐다드";
  fontWeight: "얇게" | "보통" | "굵게";
  preventZoom: boolean;
  scrollEffect: boolean;
  introShape: IntroShape;
  photoEffect: "없음" | "물결" | "안개";
  particle: "없음" | "벚꽃잎" | "눈송이" | "하트" | "데이지" | "벚꽃" | "은행잎" | "낙엽";
  rsvpTitle: string;
  rsvpDescription: string;
  rsvpButtonLabel: string;
  guestbookTitle: string;
  guestbookAdminPassword: string;
  menuOrder: MenuOrderItem[];
};

export type SavedInvitation = InvitationData & {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvitationResult = {
  invitation: SavedInvitation;
  slug: string;
};

export const defaultInvitationMessage = `살랑이는 바람결에
사랑이 묻어나는 계절입니다.
여기 곱고 예쁜 두 사람이 사랑을 맺어
인생의 반려자가 되려 합니다.
새 인생을 시작하는 이 자리에 오셔서
축복해 주시면 감사하겠습니다.`;

export const defaultMenuOrder: MenuOrderItem[] = [
  { id: "intro", label: "글귀", enabled: true },
  { id: "greeting", label: "모시는 글", enabled: true },
  { id: "calendar", label: "달력", enabled: true },
  { id: "gallery", label: "갤러리", enabled: true },
  { id: "video", label: "동영상", enabled: true },
  { id: "location", label: "오시는 길", enabled: true },
  { id: "notice", label: "안내사항", enabled: true },
  { id: "rsvp", label: "참석의사", enabled: true },
  { id: "accounts", label: "계좌번호", enabled: true },
  { id: "guestbook", label: "방명록", enabled: true },
  { id: "quote", label: "사진 & 글귀", enabled: true },
];

export const emptyInvitationData: InvitationData = {
  isPublished: true,
  coverImage: "",
  introImage: "",
  galleryImages: [],
  galleryItems: [],
  quoteImage: "",
  quoteText: "",
  kakaoThumbnailUrl: "",
  urlThumbnailUrl: "",
  groomName: "최신랑",
  brideName: "이신부",
  groomFatherLastName: "",
  groomFatherName: "",
  groomMotherLastName: "",
  groomMotherName: "",
  groomLastName: "최",
  groomFirstName: "신랑",
  groomRelation: "아들",
  groomFatherDeceased: false,
  groomMotherDeceased: false,
  brideFatherLastName: "",
  brideFatherName: "",
  brideMotherLastName: "",
  brideMotherName: "",
  brideLastName: "이",
  brideFirstName: "신부",
  brideRelation: "딸",
  brideFatherDeceased: false,
  brideMotherDeceased: false,
  brideFirstDisplay: false,
  messageTitle: "초대합니다",
  message: defaultInvitationMessage,
  weddingDate: "2026-05-18",
  weddingPeriod: "오후",
  weddingHour: "1시",
  weddingMinute: "30분",
  weddingTime: "13:30",
  showCalendar: true,
  showDday: true,
  showCountdown: false,
  venueTitle: "오시는 길",
  venueName: "더리버사이드 호텔",
  venueHall: "몽블랑홀",
  venueAddress: "",
  latitude: null,
  longitude: null,
  mapLink: "",
  showMap: true,
  lockMap: false,
  attachMap: false,
  showTransportIcons: true,
  transports: [
    { id: "subway", title: "지하철", description: "" },
    { id: "bus", title: "버스", description: "" },
    { id: "car", title: "자가용", description: "" },
  ],
  galleryTitle: "갤러리",
  galleryType: "슬라이드",
  showGalleryArrows: false,
  contacts: [
    { id: "groom", role: "신랑", name: "", phone: "" },
    { id: "groom-father", role: "신랑 아버지", name: "", phone: "" },
    { id: "groom-mother", role: "신랑 어머니", name: "", phone: "" },
    { id: "bride", role: "신부", name: "", phone: "" },
    { id: "bride-father", role: "신부 아버지", name: "", phone: "" },
    { id: "bride-mother", role: "신부 어머니", name: "", phone: "" },
  ],
  bankAccounts: [
    {
      id: "groom-account",
      side: "groom",
      groupName: "신랑측 계좌번호",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      kakaoPayEnabled: false,
      hidden: false,
    },
    {
      id: "bride-account",
      side: "bride",
      groupName: "신부측 계좌번호",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      kakaoPayEnabled: false,
      hidden: false,
    },
  ],
  groomAccount: "",
  brideAccount: "",
  youtubeUrl: "",
  youtubeVideoId: "",
  youtubeError: "",
  musicUrl: "",
  audioUrl: "",
  audioTitle: "",
  defaultMusic: "A",
  audioAutoplay: true,
  templateMood: "모던 NEW",
  themeColor: "#f29a7f",
  fontFamily: "고운고딕",
  fontWeight: "보통",
  preventZoom: true,
  scrollEffect: true,
  introShape: "기본",
  photoEffect: "없음",
  particle: "없음",
  rsvpTitle: "참석 의사 전달",
  rsvpDescription: "축하의 마음으로 참석해주시는 모든 분들을 귀하게 모실 수 있도록 참석 의사를 전달 부탁드립니다.",
  rsvpButtonLabel: "참석 의사 전달하기",
  guestbookTitle: "방명록",
  guestbookAdminPassword: "",
  menuOrder: defaultMenuOrder,
};
