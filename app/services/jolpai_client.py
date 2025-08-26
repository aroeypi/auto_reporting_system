# app/services/jolpai_client.py
import os
from typing import List, Tuple, Optional
import httpx

# ⬇️ 네 .env 키에 맞춤
JOLPAI_BASE_URL = os.getenv("JOLPAI_BASE_URL", "http://127.0.0.1:9000")
JOLPAI_TIMEOUT = int(os.getenv("JOLPAI_TIMEOUT_SECONDS", "60"))

# 내부 토큰 (너의 .env에 이미 있음: AI_INTERNAL_TOKEN=dev-secret)
AI_INTERNAL_TOKEN = os.getenv("JOLPAI_INTERNAL_TOKEN") or os.getenv("AI_INTERNAL_TOKEN", "")
AI_INTERNAL_HEADER = os.getenv("JOLPAI_INTERNAL_HEADER", "X-Internal-Token")

class JolpaiError(Exception):
    pass

async def call_ai_generate_multipart(
    prompt: str,
    files: Optional[List[Tuple[str, bytes, str]]] = None,
) -> dict:
    """
    files: [("a.pdf", b"...", "application/pdf"), ...]
    """
    headers = {}
    if AI_INTERNAL_TOKEN:
        headers[AI_INTERNAL_HEADER] = AI_INTERNAL_TOKEN

    data = {"prompt": prompt}
    files_param = None
    if files:
        files_param = [
            ("files", (name, content, ctype or "application/octet-stream"))
            for (name, content, ctype) in files
        ]

    async with httpx.AsyncClient(timeout=JOLPAI_TIMEOUT) as client:
        r = await client.post(
            f"{JOLPAI_BASE_URL}/reports/generate",
            headers=headers,
            data=data,
            files=files_param
        )
    if r.status_code >= 400:
        raise JolpaiError(f"jolpai error {r.status_code}: {r.text}")
    return r.json()
