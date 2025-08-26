# app/main.py
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.report_proxy import router as report_proxy_router  #


from app.api import report, user, team, player, game
from app.db.database import Base, engine, get_db

app = FastAPI("Backend API")

# --- CORS: .env 에서 읽어 동적으로 적용 (콤마로 여러 개 지정 가능)
origins_env = os.getenv("CORS_ORIGINS", "")
allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 개발 모드에서만 테이블 생성 (운영은 Alembic 사용)
if os.getenv("RUN_CREATE_ALL", "false").lower() == "true":
    Base.metadata.create_all(bind=engine)

# --- 공통 예외 핸들러: 중복키 등 무결성 위반 → 409로 통일
@app.exception_handler(IntegrityError)
async def integrity_error_handler(_, exc: IntegrityError):
    # 필요하면 exc.orig.pgcode 등으로 세부 분기 가능
    return JSONResponse(
        status_code=409,
        content={"detail": "Integrity constraint violated (possibly duplicate key)."},
    )

# --- 라우터 등록 (전역 prefix='/api', 라우트 내부에서 '/api' 중복 사용하지 않기)
app.include_router(report.router, prefix="/api")
app.include_router(user.router,   prefix="/api")
app.include_router(team.router,   prefix="/api")
app.include_router(player.router, prefix="/api")
app.include_router(game.router,   prefix="/api")

app.include_router(report_proxy_router)


# --- 헬스체크/DB 핑 (빠른 점검용; 필요 없으면 삭제 가능)
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/db-ping")
def db_ping(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"ok": True}
