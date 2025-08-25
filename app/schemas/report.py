#app/schemas/report.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime

class ReportRequest(BaseModel):
    topic: str
    references: Optional[List[str]] = None  # 사용자 참고자료

class ReportResponse(BaseModel):
    title: str
    content: str
    sources: List[str]

class ReportCreate(BaseModel):
    title: str
    content: str
    sources: List[str] = []
    tags: List[str] = []
    captions: Dict = {}

class ReportOut(ReportCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)