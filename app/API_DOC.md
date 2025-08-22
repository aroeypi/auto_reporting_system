# 📘 API 명세서 - 스포츠 기사 생성 서비스
### Ctrl + Shift + V 안 될 때는 수동으로 실행하면 돼: 메뉴 → View (보기) → Editor Layout → Split Right 그리고 다시 메뉴 → View → Preview 또는 열린 .md 파일에서 오른쪽 클릭 → Open Preview 선택 ###
## 🔐 인증 관련

### `POST /api/register`
- 회원가입
- Body (JSON):
```json
{
  "first_name": "홍",
  "last_name": "길동",
  "email": "hong@example.com",
  "phone": "01012345678",
  "username": "hong123",
  "password": "1234",
  "department": "컴퓨터공학과"
}
```
- Response: 생성된 사용자 객체

---

### `POST /api/login`
- 일반 로그인
- Body (JSON):
```json
{
  "username": "hong123",
  "password": "1234"
}
```
- Response:
```json
{
  "access_token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "firstName": "...",
    "email": "...",
    ...
  }
}
```

---

### `POST /api/kakao-login`
- 카카오 로그인
- Body (JSON):
```json
{
  "email": "kakao@example.com",
  "nickname": "홍카카오",
  "kakaoId": "abc123"
}
```
- Response: JWT 토큰 + 유저 정보

---

## 📰 기사 관련

### `POST /api/generate-report`
- 기사 생성 요청
- Form Data:
  - `topic`: 기사 주제 (string)
  - `references`: 참고 링크 리스트 (stringified JSON, optional)
  - `file`: 첨부파일 (optional)
- Response (JSON):
```json
{
  "id": 1,
  "title": "...",
  "content": "...",
  "sources": ["...", "..."],
  "created_at": "..."
}
```

---

### `GET /api/reports`
- 전체 기사 목록 조회
- Response:
```json
[
  {
    "id": 1,
    "title": "...",
    "content": "...",
    "sources": [...],
    "created_at": "..."
  },
  ...
]
```

---

### `GET /api/reports/{id}`
- 특정 기사 상세 조회
- Response: `ReportOut`

---
