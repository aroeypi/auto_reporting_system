# app/services/generate.py
from typing import List, Dict

def generate_report_from_llm(topic: str) -> Dict:
    # 실제로는 LLM 호출이 들어갈 자리
    return {
        "title": f"{topic}에 대한 자동 생성 보고서",
        "content": f"이 보고서는 '{topic}'에 대한 주요 내용을 다룹니다.",
        "sources": [
            "https://example.com/article1",
            "https://example.com/article2"
        ]
    }
