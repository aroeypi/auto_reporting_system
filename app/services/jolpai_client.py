# app/services/jolpai_client.py
import os, httpx
from typing import List, Tuple, Optional

JOLPAI_BASE_URL = os.getenv("JOLPAI_BASE_URL", "http://127.0.0.1:9000")
JOLPAI_TIMEOUT = int(os.getenv("JOLPAI_TIMEOUT_SECONDS", "60"))
AI_INTERNAL_TOKEN = os.getenv("AI_INTERNAL_TOKEN", "dev-secret")  # .env와 동일

async def call_ai_generate_multipart(
    prompt: str,
    files: Optional[List[Tuple[str, bytes, str]]] = None,
) -> dict:
    headers = {"x_internal_token": AI_INTERNAL_TOKEN}  # jolpai가 언더스코어 헤더를 받음
    data = {"prompt": prompt}
    files_param = None
    if files:
        files_param = [
            ("files", (name, content, ctype or "application/octet-stream"))
            for (name, content, ctype) in files
        ]
    async with httpx.AsyncClient(timeout=JOLPAI_TIMEOUT) as client:
        print(f"🔗 jolpai 호출: {JOLPAI_BASE_URL}/api/reports/generate")
        r = await client.post(
            f"{JOLPAI_BASE_URL}/api/reports/generate",
            headers=headers, data=data, files=files_param
        )
        r.raise_for_status()
        response_data = r.json()
        
        print("📥 jolpai로부터 받은 응답:")
        print(f"  - 상태코드: {r.status_code}")
        print(f"  - 전체 응답: {response_data}")
        print(f"  - tags: {response_data.get('tags')} (타입: {type(response_data.get('tags'))})")
        print(f"  - captions: {response_data.get('captions')}")
        
        return response_data

# ▶︎ 호환용 래퍼: 기존 코드가 import 하던 이름을 제공
async def request_generate_report(
    topic: str,
    references: Optional[List[str]] = None,
    files: Optional[List[Tuple[str, bytes, str]]] = None,
    file_bytes: Optional[bytes] = None,
    file_name: Optional[str] = None,
    user_request: Optional[str] = None,
    prompt: Optional[str] = None,
    content_type: Optional[str] = None,
) -> dict:
    # references를 prompt에 합쳐 힌트로 전달
    prompt = topic if not references else f"[PROMPT]{prompt}\n\n[TOPIC]\n{topic}\n\n[REFERENCES]\n" + "\n".join(references)
    blobs = None
    if file_bytes and file_name:
        blobs = [(file_name, file_bytes, content_type or "application/octet-stream")]
    if files:
        blobs = files
    return await call_ai_generate_multipart(prompt, blobs)
