from langchain_core.prompts import PromptTemplate

def get_search_prompt():
    template = """다음 정보를 바탕으로 질문에 답변하세요.

{context}

질문:
{question}
"""
    return PromptTemplate.from_template(template)