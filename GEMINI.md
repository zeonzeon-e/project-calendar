## 🚀 프로젝트 개요

이 프로젝트는 개인 및 팀의 프로젝트 일정과 할 일(To-Do)을 관리하기 위한 웹 애플리케이션입니다. Next.js, TypeScript, Tailwind CSS를 사용하여 구축되었으며, 모든 데이터는 서버 없이 사용자의 브라우저 로컬 저장소에 안전하게 보관됩니다.

주요 기능은 다음과 같습니다:
- 프로젝트 및 할 일(To-Do) CRUD 관리
- 날짜별, 월별 일정 보기 기능
- 종료일이 지난 프로젝트 자동 알림 및 데이터 처리
- 데이터 백업 및 복원 기능

## 🛠️ 기술 스택

- **Frontend**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide-React
- **Date Handling**: date-fns
- **Data Storage**: Browser LocalStorage (`projects.json`, `todos.json` 파일을 통해 관리)

## 📂 프로젝트 구조

```
/
├── client/              # Next.js 클라이언트 애플리케이션
│   ├── app/             # App Router 기반 소스 코드
│   │   ├── api/         # 백엔드 API 라우트 (데이터 처리)
│   │   ├── components/  # React 컴포넌트
│   │   └── ...
│   ├── public/          # 정적 에셋
│   ├── package.json     # 의존성 및 스크립트
│   └── next.config.ts   # Next.js 설정
├── data/                # 로컬 데이터 저장소 (JSON 파일)
│   ├── projects.json
│   └── todos.json
├── *.bat                # 앱 실행/중지/상태 확인 스크립트
└── README.md            # 프로젝트 안내 문서
```

## 💻 빌드 및 실행

### 개발 환경

1.  **의존성 설치:**
    ```bash
    cd client
    npm install
    ```

2.  **개발 서버 실행:**
    ```bash
    npm run dev
    ```
    -   애플리케이션은 `http://localhost:3002` 에서 실행됩니다.

### 프로덕션 빌드

1.  **빌드:**
    ```bash
    cd client
    npm run build
    ```

2.  **프로덕션 서버 실행:**
    ```bash
    npm run start
    ```

## 🎨 코드 컨벤션 및 스타일

- **언어**: TypeScript를 사용하여 타입 안정성을 확보합니다.
- **스타일링**: Tailwind CSS 유틸리티 클래스를 사용하여 일관된 디자인 시스템을 유지합니다.
- **컴포넌트**: 기능별로 컴포넌트를 분리하여 재사용성을 높입니다. (`/client/app/components`)
- **API**: Next.js App Router의 API 라우트를 사용하여 파일 기반으로 데이터를 처리합니다. (`/client/app/api`)
- **상태 관리**: 컴포넌트 레벨의 상태는 `useState`를 사용하며, 전역 상태는 페이지 컴포넌트에서 Props로 전달하는 방식을 주로 사용합니다.
