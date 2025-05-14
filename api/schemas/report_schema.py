from pydantic import BaseModel
from typing import Optional
from typing import List


class UploadPDFResponse(BaseModel):
    filename: str
    num_chunks: int

class GenerateReportRequest(BaseModel):
    prompt: str

class GenerateReportResponse(BaseModel):
    title: str
    content: str
    sources: List[str]