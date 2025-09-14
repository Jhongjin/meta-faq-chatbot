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
        "message": "AdMate Railway API is running"
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
    
    # 클라이언트 지연 초기화 (안전한 방식)
    try:
        if not ollama_client:
            ollama_client = get_ollama_client()
    except Exception as e:
        logger.warning(f"Ollama client initialization failed: {e}")
        ollama_client = None
    
    try:
        if not supabase_client:
            supabase_client = get_supabase_client()
    except Exception as e:
        logger.warning(f"Supabase client initialization failed: {e}")
        supabase_client = None
    
    start_time = datetime.now()
    
    try:
        # 1. 질문 임베딩 생성 (백업 시스템 포함)
        try:
            if ollama_client:
                query_embedding = await ollama_client.generate_embedding(chat_message.message)
                if not query_embedding:
                    logger.warning("Embedding generation failed, using fallback")
                    return await fallback_chat_response(chat_message.message)
            else:
                logger.warning("Ollama client unavailable, using fallback")
                return await fallback_chat_response(chat_message.message)
        except Exception as e:
            logger.error(f"Embedding error: {e}, using fallback")
            return await fallback_chat_response(chat_message.message)
        
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

@app.post("/api/pull-model")
async def pull_model(model_name: str):
    """Ollama 모델 다운로드"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{OLLAMA_BASE_URL}/api/pull",
                json={"name": model_name},
                timeout=aiohttp.ClientTimeout(total=600)  # 10분 타임아웃
            ) as response:
                if response.status == 200:
                    return {"status": "success", "message": f"Model {model_name} pulled successfully"}
                else:
                    error_text = await response.text()
                    return {"status": "error", "message": f"Failed to pull model: {error_text}"}
    except Exception as e:
        logger.error(f"Model pull error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/setup-models")
async def setup_required_models():
    """필수 모델들 자동 다운로드"""
    models_to_pull = [EMBEDDING_MODEL, LLM_MODEL]
    results = []
    
    for model in models_to_pull:
        try:
            logger.info(f"Pulling model: {model}")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{OLLAMA_BASE_URL}/api/pull",
                    json={"name": model},
                    timeout=aiohttp.ClientTimeout(total=600)
                ) as response:
                    if response.status == 200:
                        results.append({"model": model, "status": "success"})
                        logger.info(f"Successfully pulled model: {model}")
                    else:
                        error_text = await response.text()
                        results.append({"model": model, "status": "error", "message": error_text})
                        logger.error(f"Failed to pull model {model}: {error_text}")
        except Exception as e:
            results.append({"model": model, "status": "error", "message": str(e)})
            logger.error(f"Exception pulling model {model}: {e}")
    
    return {"results": results}

@app.get("/api/debug/ollama")
async def debug_ollama_connection():
    """Ollama 연결 상태 디버깅"""
    debug_info = {
        "ollama_base_url": OLLAMA_BASE_URL,
        "embedding_model": EMBEDDING_MODEL,
        "llm_model": LLM_MODEL,
        "connection_test": None,
        "tags_response": None,
        "error": None
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # 1. 기본 연결 테스트
            async with session.get(f"{OLLAMA_BASE_URL}/") as response:
                debug_info["connection_test"] = {
                    "status": response.status,
                    "text": await response.text()
                }
            
            # 2. 모델 태그 확인
            async with session.get(f"{OLLAMA_BASE_URL}/api/tags") as response:
                debug_info["tags_response"] = {
                    "status": response.status,
                    "data": await response.json() if response.status == 200 else await response.text()
                }
                
    except Exception as e:
        debug_info["error"] = str(e)
        logger.error(f"Ollama debug error: {e}")
    
    return debug_info

@app.post("/api/fallback-chat")
async def fallback_chat_endpoint(request: ChatRequest):
    """Ollama 실패 시 백업 응답 시스템"""
    try:
        # 1. Supabase에서 관련 문서 검색
        supabase_client = get_supabase_client()
        if not supabase_client:
            return {"answer": "죄송합니다. 현재 시스템에 일시적인 문제가 있습니다.", "sources": []}
        
        # 간단한 키워드 매칭으로 관련 문서 찾기
        keywords = request.message.lower().split()
        search_query = " | ".join(keywords[:3])  # 첫 3개 키워드로 검색
        
        response = supabase_client.table("documents").select("*").text_search("content", search_query).limit(3).execute()
        
        sources = []
        context_text = ""
        
        if response.data:
            for doc in response.data:
                sources.append({
                    "title": doc.get("title", "문서"),
                    "content": doc.get("content", "")[:200] + "...",
                    "url": doc.get("url", ""),
                    "updated_at": doc.get("updated_at", "")
                })
                context_text += f"문서: {doc.get('title', '')}\n내용: {doc.get('content', '')[:500]}\n\n"
        
        # 2. 규칙 기반 응답 생성
        answer = generate_rule_based_answer(request.message, context_text, sources)
        
        return {
            "answer": answer,
            "sources": sources,
            "fallback_mode": True
        }
        
    except Exception as e:
        logger.error(f"Fallback chat error: {e}")
        return {
            "answer": "죄송합니다. 현재 시스템에 문제가 있어 답변을 제공할 수 없습니다. 잠시 후 다시 시도해주세요.",
            "sources": [],
            "fallback_mode": True
        }

def generate_rule_based_answer(question: str, context: str, sources: list) -> str:
    """고도화된 규칙 기반 답변 생성"""
    question_lower = question.lower()
    
    # 고급 키워드 매칭 시스템
    meta_keywords = ["광고", "캠페인", "메타", "페이스북", "인스타그램", "threads", "리드", "전환", "타겟팅", "오디언스"]
    policy_keywords = ["정책", "가이드라인", "규정", "규칙", "승인", "거부", "제재", "위반", "금지"]
    budget_keywords = ["예산", "비용", "과금", "요금", "결제", "cpc", "cpm", "cpa", "roas", "roi"]
    creative_keywords = ["크리에이티브", "이미지", "동영상", "텍스트", "제목", "설명", "소재", "배너"]
    targeting_keywords = ["타겟팅", "오디언스", "관심사", "행동", "인구통계", "지역", "연령", "성별"]
    optimization_keywords = ["최적화", "성과", "개선", "향상", "효율", "품질", "점수", "순위"]
    
    # 키워드 점수 계산
    meta_score = sum(1 for keyword in meta_keywords if keyword in question_lower)
    policy_score = sum(1 for keyword in policy_keywords if keyword in question_lower)
    budget_score = sum(1 for keyword in budget_keywords if keyword in question_lower)
    creative_score = sum(1 for keyword in creative_keywords if keyword in question_lower)
    targeting_score = sum(1 for keyword in targeting_keywords if keyword in question_lower)
    optimization_score = sum(1 for keyword in optimization_keywords if keyword in question_lower)
    
    # 가장 높은 점수의 카테고리 결정
    scores = {
        'meta': meta_score,
        'policy': policy_score, 
        'budget': budget_score,
        'creative': creative_score,
        'targeting': targeting_score,
        'optimization': optimization_score
    }
    
    primary_category = max(scores.keys(), key=lambda k: scores[k])
    
    # Meta 광고 관련 응답
    if primary_category == 'meta' or meta_score > 0:
        if context:
            return f"""Meta 광고 관련 질문에 대한 답변입니다.

**관련 정보:**
{context[:800]}

**추가 도움:**
- 더 자세한 정보가 필요하시면 관련 문서를 확인해주세요.
- 구체적인 정책이나 가이드라인은 최신 Meta 비즈니스 도움말 센터를 참조하시기 바랍니다.

**출처:** {len(sources)}개의 관련 문서에서 정보를 수집했습니다."""
        else:
            return """Meta 광고에 대한 일반적인 안내입니다.

**기본 정보:**
- Meta 광고는 Facebook, Instagram, Threads 플랫폼에서 집행할 수 있습니다.
- 광고 정책 준수가 필수이며, 정기적으로 업데이트됩니다.
- 타겟팅, 예산, 크리에이티브 최적화가 성공의 핵심입니다.

더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다."""
    
    elif primary_category == 'policy':
        return f"""📋 **Meta 광고 정책 및 가이드라인**

**🔍 주요 정책 사항:**
- ✅ 모든 광고는 Meta의 커뮤니티 표준 및 광고 정책을 준수해야 합니다
- 📅 정책은 정기적으로 업데이트되므로 최신 버전 확인이 필수입니다
- ⚠️ 정책 위반 시 광고 거부, 계정 제한 또는 영구 정지가 있을 수 있습니다
- 🔄 정책 검토는 자동화 시스템과 수동 검토를 병행합니다

**📚 관련 문서 정보:**
{context[:600] if context else '구체적인 정책 문서가 필요하시면 Meta 비즈니스 도움말 센터를 참조하세요.'}

**💡 추가 도움:**
- 특정 업종별 정책이 궁금하시면 업종명을 함께 문의해주세요
- 광고 승인 거부 사유가 궁금하시면 구체적인 상황을 알려주세요
- 정책 업데이트 알림을 받고 싶으시면 Meta Business 뉴스레터를 구독하세요"""

    elif primary_category == 'budget':
        return f"""💰 **Meta 광고 예산 및 비용 관리**

**💳 예산 설정 옵션:**
- 📊 일일 예산: 하루에 소비할 최대 금액 설정
- 📈 총 예산: 캠페인 전체 기간 동안의 총 소비 한도
- ⏰ 예산 스케줄링: 특정 시간대/요일별 예산 조정 가능

**💸 과금 방식:**
- 🖱️ CPC (클릭당 과금): 광고 클릭 시에만 과금
- 👀 CPM (1000회 노출당 과금): 광고 노출 1000회당 과금  
- 🎯 CPA (전환당 과금): 설정한 전환 액션 발생 시에만 과금
- 📹 ThruPlay (동영상 완전 재생당 과금): 15초 이상 재생 시 과금

**📊 성과 지표:**
- ROAS (광고비 대비 매출): 투자 수익률 측정
- ROI (투자 수익률): 순이익 대비 투자 비용
- CTR (클릭률): 노출 대비 클릭 비율
- CVR (전환율): 클릭 대비 전환 비율

**📚 관련 정보:**
{context[:400] if context else ''}

**🎯 최적화 팁:**
예산 효율성을 높이려면 타겟팅 정밀도를 높이고 A/B 테스트를 통해 최적의 입찰가를 찾으세요."""

    elif primary_category == 'creative':
        return f"""🎨 **Meta 광고 크리에이티브 가이드**

**📸 이미지 광고:**
- 📐 권장 비율: 1:1 (정사각형), 4:5 (세로형), 16:9 (가로형)
- 📏 최소 해상도: 1080x1080px (정사각형 기준)
- 📝 텍스트 비율: 이미지 내 텍스트는 20% 이하 권장
- 🎯 고품질 이미지 사용으로 더 나은 성과 달성

**🎬 동영상 광고:**
- ⏱️ 권장 길이: 15-30초 (피드), 6초 (스토리)
- 🔊 자막 필수: 많은 사용자가 무음으로 시청
- 🎬 첫 3초가 핵심: 즉시 관심을 끌 수 있는 내용
- 📱 모바일 최적화: 세로 또는 정사각형 비율

**✍️ 텍스트 및 카피:**
- 🎯 명확한 CTA (Call-to-Action): "지금 구매", "자세히 보기" 등
- 💬 타겟 오디언스 맞춤 메시지
- 🔥 긴급성과 희소성 활용
- ✨ 혜택 중심의 메시지 작성

**📚 관련 정보:**
{context[:400] if context else ''}

**💡 성과 향상 팁:**
여러 크리에이티브 버전을 A/B 테스트하여 최적의 조합을 찾으세요."""

    elif primary_category == 'targeting':
        return f"""🎯 **Meta 광고 타겟팅 전략**

**👥 오디언스 유형:**
- 🎯 핵심 오디언스: 인구통계, 관심사, 행동 기반 타겟팅
- 🔄 맞춤 오디언스: 기존 고객 데이터 활용 (이메일, 전화번호 등)
- 👥 유사 오디언스: 기존 고객과 유사한 특성의 신규 오디언스
- 🔥 재타겟팅: 웹사이트 방문자 또는 앱 사용자 대상

**📊 타겟팅 옵션:**
- 📍 지역: 국가, 지역, 도시, 반경 기반 타겟팅
- 👤 인구통계: 연령, 성별, 학력, 직업, 소득 등
- ❤️ 관심사: 취미, 선호 브랜드, 활동 등
- 🛒 행동: 구매 이력, 디바이스 사용, 여행 패턴 등

**🎯 고급 타겟팅:**
- ⏰ 시간대별 타겟팅: 특정 시간에만 광고 노출
- 📱 디바이스별 타겟팅: 모바일, 데스크톱 구분
- 🌐 언어별 타겟팅: 사용자 언어 설정 기반
- 🔗 연결 상태: Wi-Fi vs 모바일 데이터 사용자

**📚 관련 정보:**
{context[:400] if context else ''}

**⚡ 최적화 전략:**
너무 좁은 타겟팅보다는 적정 규모(1만명 이상)의 오디언스로 시작하여 성과 데이터를 바탕으로 점진적으로 정밀화하세요."""

    elif primary_category == 'optimization':
        return f"""📈 **Meta 광고 최적화 전략**

**🔍 성과 분석 지표:**
- 📊 CTR (클릭률): 노출 대비 클릭 비율 - 업계 평균 0.5-2%
- 💰 CPC (클릭당 비용): 클릭 한 번당 지불 비용
- 🎯 CVR (전환율): 클릭 대비 전환 비율
- 💎 품질 순위: 광고 품질, 예상 액션률, 사용자 경험 종합 점수

**⚡ 최적화 방법:**
- 🔄 A/B 테스트: 크리에이티브, 오디언스, 배치 등 다양한 요소 테스트
- 📱 자동 배치: 모든 배치에서 자동 최적화 활용
- 🎯 전환 최적화: 픽셀을 통한 전환 추적 및 최적화
- ⏰ 예산 페이싱: 예산을 효율적으로 분배하여 지속적 노출

**📊 캠페인 구조 최적화:**
- 🎯 단일 목표: 캠페인당 하나의 명확한 목표 설정
- 📈 광고 세트 분리: 서로 다른 오디언스는 별도 광고 세트
- 🎨 크리에이티브 다양화: 광고 세트당 3-5개 크리에이티브
- 💰 예산 배분: 성과 좋은 광고 세트에 예산 집중

**🚀 고급 최적화:**
- 🤖 자동 규칙: 성과 기준 자동 예산 조정
- 📈 동적 광고: 제품 카탈로그 연동 개인화 광고
- 🎯 전환 API: 서버 간 전환 데이터 전송으로 추적 정확도 향상

**📚 관련 정보:**
{context[:400] if context else ''}

**💡 핵심 팁:**
최소 2주간 충분한 데이터를 수집한 후 최적화를 진행하고, 한 번에 하나의 요소만 변경하여 정확한 성과 분석을 하세요."""
    
    
    else:
        if context:
            return f"""질문해주신 내용에 대한 관련 정보입니다.

{context[:800]}

**참고사항:**
- 위 정보는 내부 문서에서 수집된 내용입니다.
- 더 정확한 정보가 필요하시면 관련 담당자에게 문의하시기 바랍니다.

추가 질문이 있으시면 언제든 말씀해주세요."""
        else:
            return f""""{question}"에 대한 질문을 주셨습니다.

현재 관련된 구체적인 문서를 찾지 못했습니다. 

**도움이 될 수 있는 방법:**
- 더 구체적인 키워드로 질문해주세요
- Meta 광고, 정책, 가이드라인 등 관련 용어를 포함해주세요
- 특정 상황이나 문제에 대해 자세히 설명해주세요

언제든 다시 질문해주시면 더 나은 답변을 드리겠습니다."""

async def fallback_chat_response(message: str) -> ChatResponse:
    """백업 채팅 응답 생성"""
    try:
        # Supabase에서 키워드 기반 검색
        supabase_client = get_supabase_client()
        sources = []
        context_text = ""
        
        if supabase_client:
            keywords = message.lower().split()[:3]
            search_query = " | ".join(keywords)
            
            try:
                response = supabase_client.table("documents").select("*").text_search("content", search_query).limit(3).execute()
                
                if response.data:
                    for doc in response.data:
                        sources.append({
                            "title": doc.get("title", "문서"),
                            "content": doc.get("content", "")[:200] + "...",
                            "url": doc.get("url", ""),
                            "updated_at": doc.get("updated_at", "")
                        })
                        context_text += f"문서: {doc.get('title', '')}\n내용: {doc.get('content', '')[:500]}\n\n"
            except Exception as e:
                logger.error(f"Fallback search error: {e}")
        
        # 규칙 기반 답변 생성
        answer = generate_rule_based_answer(message, context_text, sources)
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            response_time=1.0,
            fallback_mode=True
        )
        
    except Exception as e:
        logger.error(f"Fallback response error: {e}")
        return ChatResponse(
            answer="죄송합니다. 현재 시스템에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
            sources=[],
            response_time=1.0,
            fallback_mode=True
        )

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
# Force redeploy
# Trigger deploy after start command removal
