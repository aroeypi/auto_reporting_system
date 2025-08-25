# app/api/report.py
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from app.schemas.report import ReportCreate, ReportOut
from app.db.models import Report
from app.db.database import get_db
from app.core.deps import get_current_user
from app.crud.report import create_report
from app.services.rag import get_report_from_rag

router = APIRouter(tags=["reports"])

MAX_SIZE = 5 * 1024 * 1024
ALLOWED = {"application/pdf", "text/plain"}

@router.post("/generate-report", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def generate_report(
    topic: str = Form(...),
    references: str = Form("[]"),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    refs = json.loads(references or "[]")

    file_bytes, file_name = None, None
    if file:
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=415, detail="Unsupported file type")
        file_bytes = await file.read()
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        file_name = file.filename

    llm_result = get_report_from_rag(topic, refs, file_bytes, file_name)
    report_data = ReportCreate(**llm_result)
    saved = create_report(db, report_data)
    return saved

@router.get("/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    return db.query(Report).all()

@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    obj = db.query(Report).filter(Report.id == report_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    return obj
