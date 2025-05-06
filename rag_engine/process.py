import os
from langchain_core.documents import Document
from rag_engine.loader import load_pdf
from rag_engine.embedder import get_embedder
from rag_engine.vector_store import load_vector_db, add_to_vector_db

def process_pdf(file_path: str):
    """
    PDF 한 개를 벡터로 변환하여 기존 ChromaDB에 추가 저장
    각 chunk에 filename과 page 정보를 메타데이터로 포함시킴
    """
    pages = load_pdf(file_path)
    filename = os.path.basename(file_path)

    docs = [
        Document(page_content=page.page_content, metadata={
            "source": filename,
            "page": i + 1
        })
        for i, page in enumerate(pages)
    ]

    embedder = get_embedder()
    vectordb = load_vector_db(embedder, persist_dir="./vectordb")
    add_to_vector_db(docs, vectordb)
    return len(docs)  # 저장된 청크 수 리턴

def process_multiple_pdfs(file_paths: list[str]):
    """
    여러 개의 PDF 경로 리스트를 받아 모두 처리하고 전체 청크 수 반환
    """
    total_chunks = 0
    for path in file_paths:
        count = process_pdf(path)
        print(f" {path} → {count}개 저장됨")
        total_chunks += count
    return total_chunks
