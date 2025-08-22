# 📰 졸업 프로젝트 - AI 기반 스포츠 기사 생성 서비스

## 📌 개요

이 프로젝트는 사용자가 입력한 주제, 참고자료, 첨부파일 등을 기반으로 **스포츠 기사**를 자동으로 생성하는 AI 서비스입니다.  
RAG(Retrieval-Augmented Generation) 구조를 활용하여 문서를 검색하고, LLM(Large Language Model)을 통해 자연스러운 기사 형태로 작성됩니다.

---

## 🧑‍💻 기술 스택

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + SQLAlchemy
- **LLM 연동**: 외부 RAG 모델 서버 (REST API 호출)
- **Authentication**: JWT + bcrypt, 카카오 소셜 로그인
- **Vector Search**: (외부 처리) - 추후 FAISS/Chroma 연동 가능
- **Deployment 준비**: Docker, AWS (예정)

---

## 🧩 기능 요약

- [x] 기사 자동 생성 (topic + references + file 기반)
- [x] 전체 기사 목록 및 상세 조회
- [x] JWT 로그인 및 회원가입
- [x] 카카오 로그인
- [ ] 기사 스타일 옵션화 (예정)
- [ ] 관리자 기능 (예정)

---

## 📂 주요 폴더 구조

```
app/
├── api/          # FastAPI 라우터
├── schemas/      # Pydantic 스키마
├── crud/         # DB 조작 함수
├── services/     # RAG, LLM 호출
├── core/         # 인증 및 보안
├── db/           # 모델 및 DB 연결
└── main.py       # FastAPI 앱 진입점
```

---

## 🔐 환경 변수 (.env 예시)

```env
POSTGRES_USER=report_user
POSTGRES_PASSWORD=pizza
POSTGRES_DB=report_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 🚀 실행 방법

```bash
# 1. 가상환경 생성 및 의존성 설치
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. FastAPI 서버 실행
uvicorn app.main:app --reload

# 3. Swagger 문서 보기
http://localhost:8000/docs
```

---

## 👨‍🔧 개발자 정보

- **Backend**: 너 (FastAPI, 인프라, 연동 전담)
- **AI 모델링**: 팀원 B
- **Frontend**: 팀원 A

---

_Last updated: 2025-06-01_

