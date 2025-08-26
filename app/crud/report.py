# app/crud/report.py
from sqlalchemy.orm import Session
from app.db.models import Report
from app.schemas.report import ReportCreate
from app.crud.utils import commit_or_rollback

def create_report(db: Session, data: ReportCreate) -> Report:
    print(f"🗄️ create_report 호출 - 입력 데이터 tags: {data.tags}")
    report = Report(
        title=data.title, 
        content=data.content, 
        sources=data.sources,
        tags=data.tags,           # ← AI 생성 태그 포함
        captions=data.captions    # ← AI 생성 캡션 포함
    )
    db.add(report)
    commit_or_rollback(db)
    db.refresh(report)
    print(f"✅ DB 저장 후 report.tags: {report.tags}")
    return report