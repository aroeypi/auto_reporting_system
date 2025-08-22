# app/services/rag.py
from typing import Optional, List
import requests

def get_report_from_rag(topic: str, references: List[str], file_bytes: Optional[bytes] = None, file_name: Optional[str] = None) -> dict:
    files = None
    data = {
        "topic": topic,
        "references": ", ".join(references)  # references를 문자열로 전송
    }

    try:
        if file_bytes and file_name:
            files = {"file": (file_name, file_bytes, "application/pdf")}
            response = requests.post(
                "http://172.20.7.24:8000/api/generate_report",
                data=data,  # multipart/form-data 형식
                files=files,
                timeout=120
            )
        else:
            response = requests.post(
                "http://localhost:8001/api/rag",
                json={"topic": topic, "references": references},  # fallback 용
                timeout=120
            )

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"[모델 서버 연결 실패] {e}")
        print("[대체: Mock 보고서 데이터 반환]")

        # 프론트 연동 확인을 위한 임시 Mock 결과
        return {
            "title": "모델 연결 실패 - 테스트 보고서",
            "content": "현재 AI 모델에 연결할 수 없어 임시 보고서를 보여드립니다.\n\n이 보고서는 테스트용 mock 데이터입니다.",
            "sources": [
                "https://example.com/source1",
                "https://example.com/source2"
            ]
        }


#ip : 172.20.7.155
#port : 8000