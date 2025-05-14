from langchain.prompts import PromptTemplate
from rag_engine.llm import load_llm
from rag_engine.embedder import get_embedder
from rag_engine.vector_store import load_vector_db, add_to_vector_db
from rag_engine.search import search_serper
from transformers import AutoTokenizer
from langchain.schema import Document
import uuid
import json
from typing import List
from fastapi import UploadFile
from rag_engine.prompt import get_search_prompt
from rag_engine.loader import load_pdf
import requests
from fastapi import FastAPI, Form
from pydantic import BaseModel
import os

def get_report_prompt():
    template = """
    다음 문서 내용을 기반으로 사용자가 원하는 주제에 대한 보고서를 작성하세요.
    
    주제: {question}
    문서:
    {context}

    """
    return PromptTemplate.from_template(template)



def generate_report(topic: str, file: UploadFile = None, references: List[str]=None):
    docs = []
    # 1. PDF 업로드 → 저장
    if file is not None:
        save_dir = os.path.join(os.getcwd(), "data")
        os.makedirs(save_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # 2. PDF → 문서 분할
        pages = load_pdf(file_path)
        docs = [
            Document(page_content=page.page_content, metadata={"source": filename, "page": i})
            for i, page in enumerate(pages)
        ]

    # 3. 벡터 DB에 임베딩
    embedder = get_embedder()
    vectordb = load_vector_db(embedder)
    if docs:
        add_to_vector_db(docs, vectordb)


    # 4. 관련 문서 검색(내부검색)
    retriever = vectordb.as_retriever()
    internal_docs = retriever.get_relevant_documents(topic)
    
    # 외부 검색 (Serper)
    external_docs = search_serper(topic, num_results=3)

    # 6. 문서 통합 및 컨텍스트 구성성
    all_docs = internal_docs + external_docs
    context = "\n\n".join([doc.page_content for doc in all_docs])

    # 5. references가 있다면 문맥 뒷부분에 사용자 요구사항으로 붙이기
    if references:
        requirements_text = "\n\n[사용자 요구사항]\n" + "\n".join(references)
        context += requirements_text

    prompt_template = get_search_prompt()
    full_prompt = prompt_template.format(context=context, question=topic)


    # 7. 토큰 길이 제한 
    tokenizer = AutoTokenizer.from_pretrained("skt/kogpt2-base-v2")
    tokens = tokenizer.encode(full_prompt)
    if len(tokens) > 800:
        tokens = tokens[:800]
    trimmed_prompt = tokenizer.decode(tokens)
    
    # 8. LLM 호출
    llm = load_llm()
    output = llm.invoke(trimmed_prompt)

    # 9. 출처 수집
    sources = [doc.metadata.get("source") for doc in all_docs if "source" in doc.metadata]

    # 10. JSON 형태로 반환
    return {
        "title": f"{topic} 보고서",
        "content": output.strip(),
        "sources": sources
    }



# API 요청/응답 스키마
class GenerateReportRequest(BaseModel):
    prompt: str

class GenerateReportResponse(BaseModel):
    title: str
    content: str
    sources: List[str]
    
# FastAPI 라우터
app = FastAPI(title="AI Report Generator API")

@app.post("/generate_report", response_model=GenerateReportResponse)
async def generate_report_api(prompt: str = Form(...)):
    report = generate_report(prompt)
    return GenerateReportResponse(prompt=prompt, report=report)



if __name__ == "__main__":
    topic = input(" 보고서 주제를 입력하세요: ")
    report = generate_report(topic, file=None, references=None)
    print("\n📄 보고서 제목:")
    print(report["title"])
    print("\n📝 보고서 내용:")
    print(report["content"])
    print("\n🔗 참고 출처:")
    for src in report["sources"]:
        print("-", src)



