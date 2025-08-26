# app/api/report_proxy.py
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.jolpai_client import call_ai_generate_multipart

# 네 프로젝트는 보통 prefix 없이 사용했지만,
# 충돌 회피/의미 분리를 위해 /proxy/reports 로 잡음
router = APIRouter(prefix="/proxy/reports", tags=["reports"])

@router.post("/generate", summary="AI 보고서 생성 프록시(테스트용, DB 미저장)")
async def generate_report_proxy(
    prompt: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
):
    try:
        file_blobs = []
        if files:
            for f in files:
                content = await f.read()  # (대용량이면 스트리밍 고려)
                file_blobs.append((f.filename, content, f.content_type))

        ai_res = await call_ai_generate_multipart(prompt, file_blobs)
        # ✨ 여기서는 DB 저장 없이 AI 원응답 그대로 반환
        # (원하면 title/content만 추려서 ReportCreate로 저장도 가능)
        return ai_res

    except HTTPException:
        raise
    except Exception as e:
        # logger.exception("backend -> ai proxy failed")
        raise HTTPException(status_code=502, detail=f"backend -> ai proxy failed: {e}")
