from langchain_community.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, BitsAndBytesConfig
import torch



def load_llm():
    import os
    os.environ["HF_HOME"] = "D:\huggingface_cache" #usb경로 
    
    # model_id = "skt/kogpt2-base-v2"
    # model_id = "mistralai/Mistral-7B-Instruct-v0.1"
    # model_id = "HuggingFaceH4/zephyr-7b-beta"
    # model_id = "NousResearch/Nous-Hermes-2-Mistral-7B-DPO"
    model_id = "beomi/llama-2-ko-7b"
  

    print("🚀 모델 로딩 시작:", model_id)

    try:

        # 양자화 설정 (4bit)
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )


        
        tokenizer = AutoTokenizer.from_pretrained(
            model_id,
            # cache_dir="D:/huggingface_cache",
            use_fast=True
        )
        print("✅ 토크나이저 로딩 완료")
        
        # 모델 로딩
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map="auto",
            trust_remote_code=True,
            quantization_config=bnb_config,
            local_files_only=True  # 🔥 오프라인 로딩
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