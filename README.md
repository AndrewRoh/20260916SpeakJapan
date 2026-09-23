# 일본어 듣기 학습 + 일본어 책 읽기 웹앱 (PWA)

천천히 반복해서 듣는 것에 초점을 둔 일본어 회화 듣기 학습 웹앱입니다. 회화문은 Gemini가
만들고, 음성은 Google Cloud Text-to-Speech로 생성합니다. 같은 오디오 엔진으로 일본어
텍스트 책 읽기(내장 책 + 업로드/삭제)도 지원합니다.

## 폴더 구조

```
├── shared/   # client/server가 함께 쓰는 타입 + zod 스키마
├── server/   # Express API 프록시 (TTS, Gemini 레슨 생성)
└── client/   # React 19 + Vite PWA
```

## 1. 사전 준비

### 1-1. Google Cloud Text-to-Speech

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 만들거나 선택합니다.
2. **Cloud Text-to-Speech API**를 활성화합니다.
3. IAM → 서비스 계정에서 새 서비스 계정을 만들고(`Cloud Text-to-Speech API 사용자` 권한이면
   충분합니다), JSON 키 파일을 다운로드합니다.
4. 다운로드한 JSON 키 파일을 `server/gcp-service-account.json`으로 저장합니다.
   `.gitignore`에 이미 포함되어 있어 커밋되지 않습니다. **이 파일을 절대 커밋하지 마세요.**

### 1-2. Gemini API 키

1. [Google AI Studio](https://aistudio.google.com/)에서 Gemini API 키를 발급받습니다.

## 2. 환경변수 설정

`.env`와 서비스 계정 JSON 키는 모두 **`server/` 폴더 안**에 둡니다(서버 프로세스가
그 위치를 기준으로 찾습니다). `server/.env.example`을 복사해서 `server/.env`를 만들고
값을 채웁니다.

```bash
cp server/.env.example server/.env
```

```env
GEMINI_API_KEY=발급받은_키
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
PORT=8787
```

`server`는 기동 시 이 환경변수들을 zod로 검증하며, 하나라도 없으면 실행에 실패합니다.

## 3. 설치 및 실행

```bash
npm install
npm run dev
```

- `client`는 http://localhost:5173 에서, `server`는 http://localhost:8787 에서 뜹니다.
- 개발 모드에서는 Vite가 `/api` 요청을 자동으로 서버로 프록시합니다.
- 서버와 클라이언트를 따로 띄우고 싶다면 `npm run dev:server`, `npm run dev:client`를 각각
  실행하세요.

### 검증 스크립트

```bash
npm run typecheck   # 전 워크스페이스 tsc --noEmit
npm run test        # 전 워크스페이스 vitest run (실제 Google API는 호출하지 않고 mock합니다)
npm run lint         # eslint
npm run build        # 클라이언트 프로덕션 빌드
```

## 4. 사용법

1. **듣기 학습**: 상단 메뉴에서 "듣기 학습" → "+ 새 레슨" → 주제/JLPT 레벨/문장 수 입력 →
   생성. 생성된 레슨은 IndexedDB에 저장되며, 문장을 탭하거나 재생 컨트롤(속도/반복 횟수/
   반복 간격/쉐도잉)로 반복해서 들을 수 있습니다.
2. **책 읽기**: "책 읽기" 메뉴에서 내장 책 2편(N5/N4)을 바로 읽을 수 있고, `.txt` 파일을
   업로드해서 내 책을 추가할 수 있습니다(UTF-8/Shift_JIS 자동 판별, 2MB 이하). 업로드한
   책만 삭제할 수 있습니다.
3. **설정**: 기본 속도/반복 횟수/간격, 화자 A·B 음성, 책 읽기 음성, 오디오 캐시 용량을
   확인하고 전체 삭제할 수 있습니다.

같은 문장(음성+속도+텍스트 조합)을 다시 들을 때는 IndexedDB 캐시에서 즉시 재생되며 네트워크
호출이 발생하지 않습니다.

## 5. 내장 책 추가하는 방법

1. UTF-8로 인코딩된 `.txt` 파일을 `client/public/books/`에 넣습니다.
2. `client/public/books/manifest.json`에 항목을 추가합니다.

```json
{
  "id": "고유-id",
  "title": "책 제목",
  "file": "파일명.txt",
  "level": "N4"
}
```

3. 靑空文庫 형식의 루비(`｜漢字《かんじ》`)와 주석(`［＃...］`)이 있으면 자동으로 파싱되어
   후리가나로 표시되고, 없으면 그대로 평문으로 표시됩니다.

## 6. 비용 관련 주의사항

- Google Cloud TTS와 Gemini API는 모두 **사용량 기반 과금**입니다.
- 이 앱은 문장 단위로 오디오를 요청하고, `SHA-256(음성|속도|텍스트)` 키로 IndexedDB에
  캐시합니다. **같은 문장을 같은 음성/속도로 반복해서 들을 때는 추가 과금이 발생하지
  않습니다** — 반복 학습을 많이 할수록 캐시 덕분에 비용 절감 효과가 커집니다.
- 캐시는 기기(브라우저)당 약 300MB까지만 유지되며, 초과 시 오래 전에 들은 문장부터
  자동으로 삭제됩니다(LRU). 설정 화면에서 캐시 용량을 확인하고 전체 삭제할 수 있습니다.
- 레슨 생성(Gemini)과 신규 문장의 첫 TTS 요청만 과금 대상이며, 캐시된 재생과 반복
  재생/구간 반복은 추가 비용이 들지 않습니다.

## 7. 구현 범위 안내

이번 구현은 필수 요구사항(A~F)에 집중했습니다. 아래 선택적 기능은 이번 범위에서 제외했습니다.

- SSML `<mark>` + timepoints 기반 단어 단위 하이라이트
- 오프라인 시 캐시된 오디오만 재생 가능하다는 표시
- 학습 기록(날짜별 들은 문장 수)
- 루비 없는 책의 자동 후리가나 생성(형태소 분석) — 인터페이스만 남겨두고 구현하지 않았습니다.
