from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from rag_engine.llm import load_llm
from rag_engine.embedder import get_embedder
from rag_engine.vector_store import load_vector_db
from transformers import AutoTokenizer

def get_report_prompt():
    template = """
    다음 문서 내용을 기반으로 사용자가 원하는 주제에 대한 보고서를 작성하세요.
    
    주제: {question}
    문서:
    {context}

    """
    return PromptTemplate.from_template(template)


def generate_report(topic: str):
    embedder = get_embedder()
    vectordb = load_vector_db(embedder)
    retriever = vectordb.as_retriever()
    docs = retriever.get_relevant_documents(topic)

    for i, doc in enumerate(docs):
        print(f"[DOC {i}] {doc.page_content[:300]}...\n")  # 앞 300자만 미리보기

    context = "\n".join([doc.page_content for doc in docs])



     # 프롬프트 구성
    prompt_template = get_report_prompt()
    full_prompt = prompt_template.format(context=context, question=topic)

    #  토큰 길이 제한 적용 (gpt2 기준 1024 제한 → 1000으로 제한)
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    tokens = tokenizer.tokenize(full_prompt)
    if len(tokens) > 1000:
        tokens = tokens[:1000]
    trimmed_prompt = tokenizer.convert_tokens_to_string(tokens)


    # prompt = get_report_prompt().format(context=context, question=topic)
    llm = load_llm()
    output = llm.invoke(trimmed_prompt)
    return output


if __name__ == "__main__":
    topic = input(" 보고서 주제를 입력하세요: ")
    report = generate_report(topic)
    print("\n 보고서 결과:\n")
    print(report)

    #서버!?!
        # JSON payload 구성
    data = {
        "topic": topic,
        "report": report
    }

    # 서버에 POST 전송
    try:
        response = requests.post("http://localhost:8000/api/report", json=data)
        print("서버 응답 상태코드:", response.status_code)
        print("서버 응답 본문:", response.text)
    except requests.exceptions.RequestException as e:
        print("⚠️ 서버 요청 중 오류 발생:", e)