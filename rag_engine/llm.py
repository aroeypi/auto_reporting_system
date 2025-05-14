from langchain_community.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

def load_llm():
    model_id = "skt/kogpt2-base-v2"

    # Tokenizer & Model Load
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)

    # Pipeline 구성
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=100,
        do_sample=True,
        temperature=0.7,
        device=-1  # CPU로 실행
    )

    return HuggingFacePipeline(pipeline=pipe)
