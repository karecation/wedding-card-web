# 모바일 청첩장 제작 MVP

한국형 모바일 청첩장 제작 관리자 화면과 공유 페이지를 제공하는 Next.js App Router 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

Windows에서 npm이 잡히지 않는 환경에서는:

```powershell
.\node_modules\.bin\next.cmd dev
```

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. `supabase/migrations/001_initial_schema.sql`을 SQL Editor에서 실행합니다.
3. Storage bucket `invitation-images`, `invitation-audio`가 public으로 생성되었는지 확인합니다.
4. `.env.example`을 참고해 `.env.local`을 만듭니다.

필수 환경변수:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

지도 옵션:

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Vercel 배포

Vercel Project Settings > Environment Variables에 `.env.example`의 값을 등록한 뒤 배포합니다.

## 기능 체크리스트

- `/create`에서 모든 편집 섹션 header 클릭으로 접기/펼치기
- 대표 사진, 인트로, 갤러리, 사진 & 글귀, 카카오/URL 썸네일 업로드 후 즉시 preview 표시
- 저장하기 클릭 시 Supabase Storage 설정이 있으면 bucket에 업로드, 없으면 localStorage mock으로 동작
- 저장하기 클릭 시 Supabase invitations 테이블에 저장, 설정이 없으면 localStorage mock으로 동작
- 저장 후 공개 URL 복사 버튼 표시
- `/create?slug={slug}`로 기존 청첩장 편집
- `/i/{slug}`에서 editor UI 없이 모바일 청첩장 표시
- YouTube URL 입력 시 watch, youtu.be, shorts URL에서 videoId 추출
- RSVP와 방명록은 Supabase 설정 시 DB 저장, 없으면 local fallback
- 메뉴 순서 변경은 현재 native drag-and-drop으로 `menuOrder` state에 반영됩니다. `@dnd-kit/sortable` 의존성은 추가되어 있어 다음 단계에서 같은 state 구조로 교체 가능합니다.

## 현재 MVP 메모

- 지도는 API key 유무와 좌표 저장 구조가 준비되어 있으며, 실제 SDK 렌더링은 다음 단계에서 `KakaoMap`/`NaverMap` 컴포넌트로 분리해 확장하면 됩니다.
- Storage는 MVP에서 public bucket URL을 사용합니다. 추후 private bucket + signed URL로 바꾸려면 `src/lib/upload.ts`만 교체하면 됩니다.
