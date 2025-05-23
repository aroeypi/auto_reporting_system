from langchain_community.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch



def load_llm():
    import os
    os.environ["HF_HOME"] = "D:\huggingface_cache" #usb경로 
    os.environ["TRANSFORMERS_CACHE"] = "D:/huggingface_cache"
    
    # model_id = "skt/kogpt2-base-v2"
    # model_id = "mistralai/Mistral-7B-Instruct-v0.1"
    # model_id = "HuggingFaceH4/zephyr-7b-beta"
    # model_id = "NousResearch/Nous-Hermes-2-Mistral-7B-DPO"
    model_id = "beomi/llama-2-ko-7b"
    #model_id = "meta-llama/Llama-2-7b-hf"

    print("🚀 모델 로딩 시작:", model_id)

    try:
        # Tokenizer 로딩
        # tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=False)
        tokenizer = AutoTokenizer.from_pretrained("beomi/llama-2-ko-7b", use_fast=True)
        print("✅ 토크나이저 로딩 완료")

        # 모델 로딩
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        print("✅ 모델 로딩 완료")

    # Pipeline 구성
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=512, #512까지 출력가능?
            do_sample=True,
            temperature=0.7,
            top_p=0.95,                     # nucleus sampling 조정 가능
            repetition_penalty=1.1          # 중복 방지
        )
        print("✅ 모델 파이프라인 생성 완료")
        return HuggingFacePipeline(pipeline=pipe), tokenizer, model
 
    except Exception as e:
        import traceback
        print("❌ LLM 로딩 중 예외 발생!")
        traceback.print_exc()
        raise RuntimeError(f"LLM 로딩 실패: {e}")