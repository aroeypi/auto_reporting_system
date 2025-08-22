# app/crud/report.py
from sqlalchemy.orm import Session
from app.db.models import Report
from app.schemas.report import ReportCreate
from app.crud.utils import commit_or_rollback

def create_report(db: Session, data: ReportCreate) -> Report:
    report = Report(title=data.title, content=data.content, sources=data.sources)
    db.add(report)
    commit_or_rollback(db)
    db.refresh(report)
    return report