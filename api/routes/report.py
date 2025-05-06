from fastapi import APIRouter, UploadFile, File, Form
from rag_engine import process, vector_store, chain

from api.schemas.report_schema import UploadPDFResponse, GenerateReportRequest, GenerateReportResponse


import os
from api.schemas.report_schema import GenerateReportResponse
from report_generator import generate_report
from fastapi import APIRouter, UploadFile, File, HTTPException


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
async def generate_report_route(prompt: str = Form(...)):
    report = generate_report(prompt)
    return GenerateReportResponse(prompt=prompt, report=report)