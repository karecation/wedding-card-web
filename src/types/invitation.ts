export type TemplateMood = "클래식" | "로맨틱" | "모던" | "럭셔리" | "내추럴";

export type InvitationData = {
  coverImage: string;
  galleryImages: string[];
  groomName: string;
  brideName: string;
  message: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  venueAddress: string;
  mapLink: string;
  groomAccount: string;
  brideAccount: string;
  musicUrl: string;
  templateMood: TemplateMood;
};

export const emptyInvitationData: InvitationData = {
  coverImage: "",
  galleryImages: [],
  groomName: "",
  brideName: "",
  message: "",
  weddingDate: "",
  weddingTime: "",
  venueName: "",
  venueAddress: "",
  mapLink: "",
  groomAccount: "",
  brideAccount: "",
  musicUrl: "",
  templateMood: "모던",
};
