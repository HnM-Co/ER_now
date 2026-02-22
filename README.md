# 응급실 실시간 병상 정보 (ER Now)

전국 응급실의 실시간 병상 가용 정보를 확인하고, 내 위치 기반으로 가까운 응급실을 찾을 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **실시간 병상 정보**: 국립중앙의료원 API를 통해 실시간 응급실 가용 병상 정보를 제공합니다.
- **위치 기반 검색**: 사용자 위치(GPS)를 기반으로 가까운 응급실을 거리순으로 정렬하여 보여줍니다.
- **필터링**: 소아응급 진료 가능 여부 등으로 필터링할 수 있습니다.
- **즐겨찾기**: 자주 가는 병원을 즐겨찾기에 추가하여 빠르게 확인할 수 있습니다.

## 기술 스택

- React (Vite)
- TypeScript
- Tailwind CSS
- Vercel (Deployment)

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/er-now.git
cd er-now
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 공공데이터포털에서 발급받은 API 키를 입력하세요.

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
VITE_DATA_API_KEY=your_api_key_here
```

> **참고**: API 키는 [공공데이터포털](https://www.data.go.kr/)에서 '국립중앙의료원_전국 응급의료기관 종합정보' 활용신청을 통해 발급받을 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 주소)로 접속합니다.

## 배포하기 (Vercel)

이 프로젝트는 Vercel에 최적화되어 있습니다.

1. GitHub 저장소에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인하고 'Add New Project'를 클릭합니다.
3. GitHub 저장소를 선택하고 'Import'를 클릭합니다.
4. **Environment Variables** 섹션에서 `VITE_DATA_API_KEY`를 추가하고 API 키 값을 입력합니다.
5. 'Deploy'를 클릭합니다.

### Vercel 설정 (vercel.json)

`vercel.json` 파일에는 API 프록시 설정이 포함되어 있어, CORS 문제 없이 공공데이터 API를 호출할 수 있습니다.

## 라이선스

MIT License
