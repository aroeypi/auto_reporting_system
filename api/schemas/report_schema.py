from pydantic import BaseModel
from typing import Optional

class UploadPDFResponse(BaseModel):
    filename: str
    num_chunks: int

class GenerateReportRequest(BaseModel):
    prompt: str

class GenerateReportResponse(BaseModel):
    report: str
    prompt: str
