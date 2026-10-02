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

Gemini API 키는 서버가 아니라 **각 사용자가 직접** 발급받아 앱의 설정 화면에
입력합니다(아래 "4. 사용법" 참고). [Google AI Studio](https://aistudio.google.com/apikey)에서
무료로 발급받을 수 있습니다. 입력한 키는 브라우저 localStorage에만 저장되고 서버에는
저장되지 않으며, 요청할 때마다 함께 전송됩니다.

## 2. 환경변수 설정

`.env`와 서비스 계정 JSON 키는 모두 **`server/` 폴더 안**에 둡니다(서버 프로세스가
그 위치를 기준으로 찾습니다). `server/.env.example`을 복사해서 `server/.env`를 만들고
값을 채웁니다.

```bash
cp server/.env.example server/.env
```

```env
GEMINI_MODEL=gemini-3.8-flash
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
PORT=8787
```

`server`는 기동 시 이 환경변수들을 zod로 검증하며, 하나라도 없으면 실행에 실패합니다.
(`GEMINI_MODEL`과 `GOOGLE_APPLICATION_CREDENTIALS`는 기본값/선택값이 있어 비워둬도 됩니다.)

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
3. **설정**: Gemini API Key(레슨 생성에 필수, 기기별로 1회만 입력하면 됨), 기본 속도/
   반복 횟수/간격, 화자 A·B 음성, 책 읽기 음성, 오디오 캐시 용량을 확인하고 전체 삭제할
   수 있습니다.

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

## 6. Docker Compose로 배포하기 (예: Synology NAS)

프로덕션에서는 서버가 클라이언트 빌드 결과물(`client/dist`)도 같이 서빙합니다. 즉,
**컨테이너 하나 + 포트 하나**로 전체 앱이 뜹니다.

1. NAS(또는 배포할 서버)에 저장소를 준비합니다. 예: Synology의 `/volume1/docker/SpeakNihongo`
   ```bash
   cd /volume1/docker
   git clone https://github.com/AndrewRoh/20260916SpeakJapan.git SpeakNihongo
   cd SpeakNihongo
   ```
2. `server/.env`와 `server/gcp-service-account.json`을 로컬에서 하던 것과 동일하게
   준비합니다(1~2단계 참고). 이 두 파일은 이미지에 포함되지 않고 컨테이너 실행 시
   `docker-compose.yml`이 그대로 읽어들입니다.
3. 빌드 후 백그라운드로 실행합니다.
   ```bash
   docker compose up -d --build
   ```
4. `http://<NAS-IP>:30020`으로 접속하면 바로 앱이 뜹니다(같은 포트에서 화면과 API를 모두
   서빙하므로 `/api` 프록시 설정이 따로 필요 없습니다).

호스트 포트는 `docker-compose.yml`의 `ports`(`"30020:8787"`)에서 바꿀 수 있습니다(콜론
왼쪽이 NAS에서 열리는 포트). Synology의 리버스 프록시(제어판 → 로그인 포털 → 고급 →
리버스 프록시)에 이 컨테이너 포트를 연결해서 도메인/HTTPS를 붙일 수도 있습니다.

업데이트할 때는:
```bash
git pull
docker compose up -d --build
```

로그 확인 / 중지:
```bash
docker compose logs -f
docker compose down
```

## 7. 비용 관련 주의사항

- Google Cloud TTS와 Gemini API는 모두 **사용량 기반 과금**입니다.
- 이 앱은 문장 단위로 오디오를 요청하고, `SHA-256(음성|속도|텍스트)` 키로 IndexedDB에
  캐시합니다. **같은 문장을 같은 음성/속도로 반복해서 들을 때는 추가 과금이 발생하지
  않습니다** — 반복 학습을 많이 할수록 캐시 덕분에 비용 절감 효과가 커집니다.
- 캐시는 기기(브라우저)당 약 300MB까지만 유지되며, 초과 시 오래 전에 들은 문장부터
  자동으로 삭제됩니다(LRU). 설정 화면에서 캐시 용량을 확인하고 전체 삭제할 수 있습니다.
- 레슨 생성(Gemini)과 신규 문장의 첫 TTS 요청만 과금 대상이며, 캐시된 재생과 반복
  재생/구간 반복은 추가 비용이 들지 않습니다.

## 8. 로그인 + 클라우드 동기화 (Firebase)

로그인하지 않아도 지금까지처럼 모든 기능이 기기 로컬(IndexedDB)에서 그대로 동작합니다.
**Google로 로그인하면** 레슨/내가 올린 책/읽기 진행 위치/설정이 Firestore로 자동 동기화되어
다른 기기에서도 이어볼 수 있습니다.

### 설정

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트 선택 → **Authentication**
   → **Sign-in method** → **Google** 제공업체 사용 설정
2. **Firestore Database** 생성(아직 안 했다면) → 저장소 루트의 `firestore.rules`를 배포:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
3. `client/src/shared/firebase/config.ts`의 Firebase 설정값(`apiKey` 등)을 본인 프로젝트
   값으로 맞춰주세요. 이 값들은 비밀값이 아니라 번들에 그대로 포함되어도 안전합니다(접근
   제어는 Firestore 규칙과 로그인으로 합니다).
4. **중요**: Firebase Authentication은 **Authorized domains**(승인된 도메인)에 등록된
   주소에서만 로그인 팝업이 동작합니다. 기본값은 `localhost`와
   `<project-id>.firebaseapp.com` 정도만 포함되어 있어서, NAS IP(`192.168.x.x`)나 실제
   도메인으로 접속한다면 **Authentication → Settings → Authorized domains**에 그 주소를
   추가해야 합니다. 안 해두면 로그인 시 `auth/unauthorized-domain` 오류가 납니다.

### 동작 방식

- 레슨 생성/삭제, 책 업로드/삭제, 읽기 진행 위치, 설정 변경 — 로그인 중이면 즉시
  Firestore로도 같이 저장됩니다(실패해도 로컬 동작은 막지 않습니다).
- 로그인하는 순간 클라우드에 있던 데이터와 로컬 데이터를 합칩니다. 같은 항목이 양쪽에
  다 있으면 더 최근에 수정된 쪽을 기준으로 맞춥니다.
- 내장 책(bundled)은 동기화 대상이 아니며, 로그아웃 상태를 포함해 삭제 이력은 별도로
  추적하지 않으므로 "로그아웃 상태에서 삭제 → 다시 로그인" 시 클라우드에 남아있던
  이전 데이터가 복원될 수 있습니다.

## 9. GitHub Pages로 화면 배포하기

`.github/workflows/deploy-pages.yml`이 `main`에 푸시될 때마다 `client`를 빌드해서
`https://<계정>.github.io/20260916SpeakJapan/`에 자동 배포합니다.

**저장소 설정에서 한 번만 해주셔야 할 것**: GitHub 저장소 → Settings → Pages →
**Source**를 "Deploy from a branch"가 아니라 **"GitHub Actions"**로 바꿔주세요.
이걸 안 바꾸면 저장소 루트(README 등)가 그대로 노출되고 실제 앱은 안 뜹니다.

### ⚠️ 중요한 제약 — API 서버는 GitHub Pages에 올라가지 않습니다

GitHub Pages(Netlify도 동일)는 **정적 파일만 서빙**합니다. TTS용 GCP 서비스 계정
자격증명을 쓰는 `server`(Express, TTS/Gemini 프록시)는 별도로 어딘가에서 실행되어야
합니다. 지금 배포는 **화면(client)만** 올라가므로, API 서버 주소를 정하기 전까지는
레슨 생성·TTS 재생이 동작하지 않습니다(화면 자체, 내장 책 읽기 등 로컬 기능은 정상
동작). Gemini API Key는 서버가 아니라 각 사용자가 설정 화면에 직접 입력하므로
배포 시 따로 준비할 필요는 없습니다.

API 서버는 이미 만들어둔 `Dockerfile`로 Render/Fly.io/**Google Cloud Run**이나
Synology NAS(Docker Compose) 등 Node를 실행할 수 있는 곳이면 어디든 올릴 수 있습니다.
API 서버 주소가 정해지면 아래 2단계만 해주시면 됩니다.

1. GitHub 저장소 → Settings → Secrets and variables → Actions → **Variables** 탭 →
   `API_BASE_URL`이라는 이름으로 그 주소(예: `https://jp-listening-app-xxxxx.a.run.app`,
   끝에 슬래시(`/`) 없이)를 등록합니다. 워크플로가 빌드 시 이 값을
   `VITE_API_BASE_URL`로 주입해서 `/api/...` 상대경로 대신 그 절대 주소를 쓰도록
   빌드합니다(`client/src/shared/api/apiBaseUrl.ts`).
2. 서버 쪽 CORS는 이미 모든 출처를 허용하도록(`cors()` 기본값) 되어 있어 추가 설정이
   필요 없습니다.

### Google Cloud Run에 API 서버 배포하기

```bash
gcloud run deploy jp-listening-app \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated
```

Gemini 모델은 기본값(`gemini-3.8-flash`)을 그대로 쓰면 되고, 바꾸고 싶으면
`--set-env-vars GEMINI_MODEL=원하는_모델명`을 추가하세요.

- `--source .`는 저장소 루트의 `Dockerfile`을 그대로 빌드합니다(Cloud Build 사용).
- Cloud Run에서는 서비스에 **서비스 계정을 연결**해서 쓰는 걸 권장합니다(배포 시
  `--service-account` 옵션, 또는 콘솔의 "보안" 탭). 서비스 계정에 Text-to-Speech
  권한만 있으면 되고, 이 경우 **`GOOGLE_APPLICATION_CREDENTIALS`는 설정하지 않아도
  됩니다** — 코드가 비어 있으면 Cloud Run이 자동으로 제공하는 자격증명(ADC)을
  그대로 쓰도록 되어 있습니다. 로컬/Docker처럼 키 파일을 직접 쓰는 환경에서만
  `GOOGLE_APPLICATION_CREDENTIALS`를 채워주세요.
- 배포 후 나온 URL(`https://jp-listening-app-xxxxx.a.run.app`)을 위 1번의
  `API_BASE_URL`에 등록하세요.

## 10. 구현 범위 안내

이번 구현은 필수 요구사항(A~F)에 집중했습니다. 아래 선택적 기능은 이번 범위에서 제외했습니다.

- SSML `<mark>` + timepoints 기반 단어 단위 하이라이트
- 오프라인 시 캐시된 오디오만 재생 가능하다는 표시
- 학습 기록(날짜별 들은 문장 수)
- 루비 없는 책의 자동 후리가나 생성(형태소 분석) — 인터페이스만 남겨두고 구현하지 않았습니다.
