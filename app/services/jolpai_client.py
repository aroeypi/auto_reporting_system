# app/services/jolpai_client.py
import os
import httpx
from typing import Optional, List, Tuple

JOLPAI_BASE_URL = os.getenv("JOLPAI_BASE_URL", "http://127.0.0.1:8101")
JOLPAI_TIMEOUT = float(os.getenv("JOLPAI_TIMEOUT_SECONDS", "60"))

class JolpaiError(Exception):
    pass

async def request_generate_report(
    prompt: str,
    file_items: Optional[List[Tuple[str, bytes, str]]] = None,
) -> dict:
    """
    file_items: [ (filename, bytes, content_type), ... ]
    """
    data = {"prompt": prompt}
    files = []
    for (fname, fb, ctype) in (file_items or []):
        files.append(("files", (fname, fb, ctype)))

    async with httpx.AsyncClient(timeout=JOLPAI_TIMEOUT) as client:
        resp = await client.post(
            f"{JOLPAI_BASE_URL}/reports/generate",
            data=data,
            files=files or None,
        )
    if resp.status_code >= 400:
        raise JolpaiError(f"jolpai error {resp.status_code}: {resp.text}")
    return resp.json()
