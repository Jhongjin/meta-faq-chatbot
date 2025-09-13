"""
Railway + Ollama 기반 Meta FAQ AI 챗봇 백엔드
FastAPI를 사용한 RAG 시스템 구현
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
import aiohttp
from datetime import datetime
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Meta FAQ AI Chatbot API",
    description="Railway + Ollama 기반 RAG 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2:3b")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))
TOP_K = int(os.getenv("TOP_K", "5"))

# Pydantic 모델들
class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]]
    confidence: float
    processing_time: float
    model: str

class DocumentUpload(BaseModel):
    title: str
    content: str
    document_type: str
    metadata: Optional[Dict[str, Any]] = None

# Ollama 클라이언트
class OllamaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    async def generate_embedding(self, text: str) -> List[float]:
        """텍스트 임베딩 생성"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": EMBEDDING_MODEL, "prompt": text}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("embedding", [])
                    else:
                        logger.error(f"Embedding API error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return []
    
    async def generate_response(self, prompt: str, context: str = "") -> str:
        """LLM 응답 생성"""
        try:
            full_prompt = f"""다음 컨텍스트를 바탕으로 사용자의 질문에 정확하고 도움이 되는 답변을 제공해주세요.

컨텍스트:
{context}

사용자 질문: {prompt}

답변:"""
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": LLM_MODEL,
                        "prompt": full_prompt,
                        "stream": False
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "")
                    else:
                        logger.error(f"LLM API error: {response.status}")
                        return "죄송합니다. 현재 서비스에 문제가 있습니다."
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            return "죄송합니다. 현재 서비스에 문제가 있습니다."

# Supabase 클라이언트 (간단한 구현)
class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    
    async def search_similar_chunks(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """유사한 문서 청크 검색"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.url}/rest/v1/rpc/search_similar_chunks",
                    headers=self.headers,
                    json={
                        "query_embedding": query_embedding,
                        "match_threshold": 0.7,
                        "match_count": limit
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        logger.error(f"Supabase search error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Supabase search error: {e}")
            return []

# 클라이언트 초기화 (지연 로딩)
def get_ollama_client():
    return OllamaClient(OLLAMA_BASE_URL)

def get_supabase_client():
    if SUPABASE_URL and SUPABASE_KEY:
        return SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    return None

# 전역 클라이언트 (실제 사용 시점에 초기화)
ollama_client = None
supabase_client = None

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "AdMate Railway API is running",
        "version": "1.0.0",
        "environment": {
            "ollama_url": OLLAMA_BASE_URL,
            "has_supabase": bool(SUPABASE_URL and SUPABASE_KEY)
        }
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    try:
        # Ollama 연결 상태 확인
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0) as response:
                ollama_status = "connected" if response.status == 200 else "disconnected"
    except Exception as e:
        logger.error(f"Ollama connection error: {e}")
        ollama_status = "disconnected"
    
    return {
        "status": "healthy",
        "ollama_status": ollama_status,
        "ollama_url": OLLAMA_BASE_URL,
        "supabase_url": SUPABASE_URL
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    """채팅 메시지 처리"""
    global ollama_client, supabase_client
    
    # 클라이언트 지연 초기화
    if not ollama_client:
        ollama_client = get_ollama_client()
    if not supabase_client:
        supabase_client = get_supabase_client()
    
    start_time = datetime.now()
    
    try:
        # 1. 질문 임베딩 생성
        query_embedding = await ollama_client.generate_embedding(chat_message.message)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="임베딩 생성 실패")
        
        # 2. 유사한 문서 검색
        search_results = []
        if supabase_client:
            search_results = await supabase_client.search_similar_chunks(query_embedding, TOP_K)
        
        # 3. 컨텍스트 구성
        context = ""
        sources = []
        
        for result in search_results:
            context += f"\n{result.get('content', '')}"
            sources.append({
                "title": result.get('title', 'Unknown'),
                "content": result.get('content', '')[:200] + "...",
                "similarity": result.get('similarity', 0.0),
                "source_type": result.get('source_type', 'document'),
                "document_type": result.get('document_type', 'file')
            })
        
        # 4. LLM 응답 생성
        response_text = await ollama_client.generate_response(chat_message.message, context)
        
        # 5. 응답 시간 계산
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ChatResponse(
            response=response_text,
            sources=sources,
            confidence=0.8,  # 기본값
            processing_time=processing_time,
            model=LLM_MODEL
        )
        
    except Exception as e:
        logger.error(f"Chat processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form(...)
):
    """문서 업로드 및 처리"""
    try:
        # 파일 내용 읽기
        content = await file.read()
        content_text = content.decode('utf-8')
        
        # 문서 청크 생성 (간단한 구현)
        chunks = [content_text[i:i+1000] for i in range(0, len(content_text), 1000)]
        
        # 각 청크에 대해 임베딩 생성 및 저장
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            embedding = await ollama_client.generate_embedding(chunk)
            if embedding:
                processed_chunks.append({
                    "chunk_id": f"{title}_chunk_{i}",
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {
                        "title": title,
                        "document_type": document_type,
                        "chunk_index": i
                    }
                })
        
        return {
            "message": "문서가 성공적으로 처리되었습니다.",
            "chunks_processed": len(processed_chunks),
            "title": title
        }
        
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def get_available_models():
    """사용 가능한 모델 목록 조회"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_BASE_URL}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    return {"models": data.get("models", [])}
                else:
                    return {"models": []}
    except Exception as e:
        logger.error(f"Model list error: {e}")
        return {"models": []}

# Railway에서 직접 실행을 위한 설정
def get_port():
    """Railway PORT 환경변수 안전한 파싱"""
    port_env = os.getenv('PORT', '8000')
    print(f"[STARTUP] Raw PORT environment variable: '{port_env}'")
    
    # Railway에서 $PORT가 문자열로 전달되는 경우 처리
    if port_env == '$PORT' or not port_env.isdigit():
        print(f"[STARTUP] Invalid PORT value '{port_env}', using default 8000")
        return 8000
    
    try:
        port = int(port_env)
        print(f"[STARTUP] Successfully parsed PORT: {port}")
        return port
    except (ValueError, TypeError) as e:
        print(f"[STARTUP] PORT parsing error: {e}, using default 8000")
        return 8000

if __name__ == "__main__":
    import uvicorn
    import sys
    
    port = get_port()
    
    print(f"[STARTUP] Starting AdMate API server...")
    print(f"[STARTUP] Host: 0.0.0.0, Port: {port}")
    print(f"[STARTUP] OLLAMA_BASE_URL: {OLLAMA_BASE_URL}")
    print(f"[STARTUP] SUPABASE_URL: {'***' if SUPABASE_URL else 'NOT_SET'}")
    
    try:
        uvicorn.run(
            "app:app",  # 모듈:앱 형식으로 지정
            host="0.0.0.0", 
            port=port, 
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"[ERROR] Server startup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
