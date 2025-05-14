from fastapi import APIRouter, UploadFile, File, Form
from rag_engine import process, vector_store, chain

from api.schemas.report_schema import UploadPDFResponse, GenerateReportRequest, GenerateReportResponse


import os
from api.schemas.report_schema import GenerateReportResponse
from report_generator import generate_report
from fastapi import APIRouter, UploadFile, Form, File, HTTPException
import json

from rag_engine.process import process_pdf


router = APIRouter()

@router.post("/upload_pdf", response_model=UploadPDFResponse)
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # temp_uploads 폴더에 저장
        save_dir = os.path.join(os.getcwd(), "data")
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, file.filename)

        # 파일 저장
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # PDF → 벡터DB 저장
        num_chunks = process_pdf(file_path)  # 여기서 실제로 저장됨

        return UploadPDFResponse(
            filename=file.filename,
            num_chunks=num_chunks
        )

    except Exception as e:
        print(" 업로드 중 오류:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_report", response_model=GenerateReportResponse)
async def generate_report_route(
    topic: str = Form(...),
    references: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        references_list = [ref.strip() for ref in references.split(",") if ref.strip()]
        report = generate_report(topic=topic, file=file, references=references_list)
        
        return GenerateReportResponse(
            title="",  # 아직 제목 없음
            content=report,  # 기존 보고서 본문
            sources=[]  # 아직 출처 없음
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"🚨 오류 발생: {e}")