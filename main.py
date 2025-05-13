# app/main.py
from fastapi import FastAPI
from app.api import report
from app.db.database import Base, engine
from app.db import models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 허용 (임시로 전체 허용 - 배포시 도메인 제한 필요)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 ["http://localhost:3000"] 등 명시적으로 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 테이블 생성은 여기서만 한 번 호출
Base.metadata.create_all(bind=engine)

app.include_router(report.router, prefix="/api")
