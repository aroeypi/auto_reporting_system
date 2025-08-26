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
from app.services.jolpai_client import request_generate_report  # jolpai:127.0.0.1:9000 호출

router = APIRouter(tags=["reports"])

# 업로드 제한(필요 시 조정)
MAX_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED = {
    "application/pdf",
    "text/plain",
    # jolpai 업로드가 PDF/CSV를 지원하므로 CSV MIME도 허용
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
}

@router.post("/generate-report", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def generate_report(
    topic: str = Form(...),
    references: str = Form("[]"),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    #_user=Depends(get_current_user)
):
    """
    보고서 생성 엔드포인트(프런트 미연동 상태에서도 동작).
    - 입력: topic(필수), references(JSON string), file(선택)
    - 처리: server → jolpai(9000)로 내부 포워딩 → 결과를 DB에 저장
    - 출력: 저장된 Report 레코드
    """
    # 1) references 파싱
    try:
        refs = json.loads(references or "[]")
        if not isinstance(refs, list):
            raise ValueError("references must be a JSON array (list)")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid 'references' JSON")

    # 2) 파일 검증 및 로드
    file_bytes, file_name, content_type = None, None, None
    if file:
        if file.content_type not in ALLOWED:
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")
        file_bytes = await file.read()
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        file_name = file.filename
        content_type = file.content_type or "application/octet-stream"

    # 3) prompt 구성 (refs는 임시로 prompt에 포함)
    prompt = topic if not refs else f"{topic}\n\n[REFERENCES]\n" + "\n".join(map(str, refs))

    # 4) jolpai 호출 (멀티파트로 내부 포워딩)
    file_items = [(file_name, file_bytes, content_type)] if file_bytes else None
    try:
        llm_result = await request_generate_report(topic=topic, prompt=prompt, files=file_items)
    except Exception as e:
        # upstream 오류는 502로 매핑
        raise HTTPException(status_code=502, detail=f"AI upstream error: {str(e)}")

    # 5) DB 저장 스키마로 매핑 (AI 생성 tags/captions 포함)
    title = llm_result.get("title")
    content = llm_result.get("content")
    sources = llm_result.get("sources", [])
    tags = llm_result.get("tags", [])
    captions = llm_result.get("captions", {})

    print("🔧 auto_reporting_system 응답 처리:")
    print(f"  - jolpai로부터 받은 tags: {tags} (타입: {type(tags)})")
    print(f"  - jolpai로부터 받은 captions: {captions} (타입: {type(captions)})")

    if not title or not content:
        raise HTTPException(status_code=502, detail="AI response missing required fields (title/content)")

    try:
        report_data = ReportCreate(
            title=title,
            content=content,
            sources=sources if isinstance(sources, list) else [],
            tags=tags if isinstance(tags, list) else [],
            captions=captions if isinstance(captions, dict) else {},
        )
        print(f"✅ ReportCreate 생성 완료 - tags: {report_data.tags}")
    except Exception as e:
        print(f"❌ ReportCreate 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to build ReportCreate: {str(e)}")

    saved = create_report(db, report_data)
    print(f"💾 DB 저장 완료 - saved.tags: {saved.tags}")
    print(f"🚀 최종 반환할 데이터 - id: {saved.id}, tags: {saved.tags}")
    return saved


@router.get("/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    """
    보고서 목록 조회
    """
    return db.query(Report).all()


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """
    보고서 단건 조회
    """
    obj = db.query(Report).filter(Report.id == report_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    return obj
