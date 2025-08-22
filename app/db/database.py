# app/db/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# --- ENV 읽기 ---
POSTGRES_DB = os.getenv("POSTGRES_DB", "report_db")
POSTGRES_USER = os.getenv("POSTGRES_USER", "report_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "pizza")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# --- 엔진 옵션 ---
# pool_pre_ping: 유휴 커넥션 복구
# pool_size/max_overflow: 기본 풀 사이즈(로컬은 작게, 서버는 늘리기)
# future=True: 2.x 스타일
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    future=True,
    # RDS/클라우드라면 SSL이 필요할 수 있음:
    #connect_args={"sslmode": "require"},
)

# --- 세션팩토리 ---
# autocommit=False: 명시적으로 commit 필요
# autoflush=False: flush 타이밍 제어(필요 시 db.flush())
# expire_on_commit=False: 응답 직후 객체 속성 접근 가능하게
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)

Base = declarative_base()

# --- 요청 단위 세션 의존성 ---
def get_db():
    db: Session = SessionLocal()
    try:
        # 현재 구조(각 CRUD가 commit/rollback) 유지
        # 이 함수는 세션만 열고 닫는다.
        yield db
    finally:
        db.close()
