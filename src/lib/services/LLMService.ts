/**
 * LLM (Large Language Model) 서비스
 * Ollama를 통한 전문적인 답변 생성
 */

export interface LLMResponse {
  answer: string;
  confidence: number;
  processingTime: number;
  model: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class LLMService {
  private baseUrl: string;
  private defaultModel: string;
  private defaultOptions: LLMOptions;

  constructor() {
    // Ollama 설정 - Render 서버 지원
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    // Render 무료 티어 최적화 모델: qwen2.5:1.5b (메모리 효율성과 성능의 균형)
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';
    this.defaultOptions = {
      model: this.defaultModel,
      temperature: 0.3, // 창의성과 일관성의 균형
      maxTokens: 2000, // 충분한 길이의 구조화된 답변을 위해 증가
      systemPrompt: this.getDefaultSystemPrompt()
    };
    
    console.log('🔧 LLMService 초기화:', {
      baseUrl: this.baseUrl,
      model: this.defaultModel,
      isExternalServer: !this.baseUrl.includes('localhost')
    });
  }

  /**
   * 기본 시스템 프롬프트 생성
   */
  private getDefaultSystemPrompt(): string {
    return `당신은 Meta(Facebook, Instagram) 광고 정책과 가이드라인에 대한 전문가입니다.

중요: 반드시 한국어로만 답변하세요. 영어나 다른 언어는 사용하지 마세요.

주어진 문서 내용을 바탕으로 사용자의 질문에 정확하고 전문적인 답변을 제공해주세요.

답변 가이드라인:
1. 반드시 한국어로만 답변하세요
2. 주어진 문서 내용만을 바탕으로 답변하세요
3. 정확하고 구체적인 정보를 제공하세요
4. 관련 정책이나 가이드라인이 있다면 명시하세요
5. 답변할 수 없는 내용은 솔직히 말씀하세요
6. 자연스럽고 전문적인 한국어로 답변하세요
7. 답변은 반드시 구조화되어 있고 이해하기 쉽게 작성하세요
8. 필요시 단계별 설명이나 예시를 포함하세요

답변 형식 (한국어로만, 반드시 이 형식을 따라주세요):
**핵심 답변**
[질문에 대한 핵심 답변을 한국어로 제시]

**상세 설명**
[구체적인 설명을 한국어로 제공]

**관련 정책**
[관련 정책이나 주의사항을 한국어로 명시]

**실무 가이드라인**
[필요시 실무 가이드라인을 한국어로 제시]

주의사항:
- 절대 영어나 다른 언어를 사용하지 마세요
- 완전한 문장으로 답변하세요
- 답변을 중간에 끊지 마세요
- 모든 내용을 한국어로만 작성하세요
- 반드시 위의 구조화된 형식을 따라주세요`;
  }

  /**
   * Ollama API 호출
   */
  private async callOllamaAPI(
    prompt: string, 
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Vercel 환경에서는 Ollama가 실행되지 않으므로 fallback 응답
    // 하지만 Render나 다른 외부 서버를 사용하는 경우는 제외
    if (process.env.VERCEL && !process.env.OLLAMA_BASE_URL?.includes('render.com')) {
      console.warn('Vercel 환경에서 외부 Ollama 서버가 설정되지 않았습니다. Fallback 응답을 반환합니다.');
      return this.generateFallbackResponse(prompt, options, startTime);
    }
    
    try {
      const requestOptions = { ...this.defaultOptions, ...options };
      
      console.log(`🚀 Ollama API 호출 시작: ${this.baseUrl}/api/generate`);
      console.log(`📝 모델: ${requestOptions.model}, 프롬프트 길이: ${prompt.length}`);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: requestOptions.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: requestOptions.temperature,
            num_predict: requestOptions.maxTokens,
          }
        }),
        // 타임아웃 설정 (30초)
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Ollama API 오류: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Ollama API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      console.log(`✅ Ollama API 응답 완료: ${processingTime}ms, 답변 길이: ${data.response?.length || 0}`);

      return {
        answer: data.response || '답변을 생성할 수 없습니다.',
        confidence: this.calculateConfidence(data.response),
        processingTime,
        model: requestOptions.model || this.defaultModel
      };

    } catch (error) {
      console.error('Ollama API 호출 실패:', error);
      return this.generateFallbackResponse(prompt, options, startTime);
    }
  }

  /**
   * Fallback 응답 생성 (Ollama가 사용 불가능한 경우)
   */
  private generateFallbackResponse(
    prompt: string, 
    options: LLMOptions, 
    startTime: number
  ): LLMResponse {
    const processingTime = Date.now() - startTime;
    
    // 간단한 키워드 기반 응답 생성
    const answer = this.generateSimpleResponse(prompt);
    
    return {
      answer,
      confidence: 0.3, // 낮은 신뢰도
      processingTime,
      model: options.model || this.defaultModel
    };
  }

  /**
   * 간단한 키워드 기반 응답 생성 (개선된 버전)
   */
  private generateSimpleResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('광고') && lowerPrompt.includes('정책')) {
      return `**Meta 광고 정책 안내**

Meta 광고 정책에 대한 질문이군요. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있어, 기본 정보를 제공해드립니다.

**주요 광고 정책:**
- 광고는 정확하고 진실된 정보를 포함해야 합니다
- 금지된 콘텐츠(폭력, 성인 콘텐츠, 허위 정보 등)는 광고에 사용할 수 없습니다
- 개인정보 보호 및 데이터 사용에 대한 정책을 준수해야 합니다

**더 자세한 정보:**
- Meta 비즈니스 도움말 센터: https://www.facebook.com/business/help
- 광고 정책 센터: https://www.facebook.com/policies/ads

관리자에게 문의하시면 더 구체적인 답변을 받으실 수 있습니다.`;
    }
    
    if (lowerPrompt.includes('facebook') || lowerPrompt.includes('instagram')) {
      return `**Facebook/Instagram 광고 안내**

Facebook이나 Instagram 관련 질문이군요. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있어, 기본 정보를 제공해드립니다.

**주요 플랫폼 특징:**
- Facebook: 광범위한 타겟팅 옵션과 다양한 광고 형식
- Instagram: 시각적 콘텐츠 중심의 광고와 스토리 광고
- 두 플랫폼 모두 Meta 광고 관리자에서 통합 관리 가능

**더 자세한 정보:**
- Meta 비즈니스 도움말 센터에서 최신 정보를 확인하시거나, 관리자에게 문의해주세요.`;
    }
    
    if (lowerPrompt.includes('승인') || lowerPrompt.includes('거부')) {
      return `**광고 승인 관련 안내**

광고 승인 관련 질문이군요. 광고 승인 과정은 복잡하며 여러 요인에 따라 달라집니다.

**광고 승인 과정:**
1. 광고 콘텐츠 검토 (자동 + 수동)
2. 정책 위반 여부 확인
3. 승인/거부 결정 (보통 24시간 이내)
4. 거부 시 수정 후 재제출 가능

**승인률 향상 팁:**
- Meta 광고 정책을 철저히 숙지
- 명확하고 정확한 광고 콘텐츠 작성
- 금지된 콘텐츠 사용 금지

현재 AI 답변 생성 서비스가 일시적으로 중단되어 있으므로, Meta 광고 정책 문서를 직접 확인하시거나 관리자에게 문의해주세요.`;
    }
    
    return `**Meta 광고 FAQ 안내**

죄송합니다. 현재 AI 답변 생성 서비스가 일시적으로 중단되어 있습니다.

**대안 방법:**
1. Meta 비즈니스 도움말 센터에서 직접 검색
2. 광고 정책 센터에서 관련 문서 확인
3. 관리자에게 직접 문의

**유용한 링크:**
- Meta 비즈니스 도움말: https://www.facebook.com/business/help
- 광고 정책: https://www.facebook.com/policies/ads
- 광고 관리자: https://business.facebook.com

더 구체적인 도움이 필요하시면 관리자에게 문의해주세요.`;
  }

  /**
   * Ollama 서비스 상태 확인
   */
  async checkOllamaStatus(): Promise<boolean> {
    try {
      console.log(`🔍 Ollama 서비스 상태 확인: ${this.baseUrl}`);
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 타임아웃 설정 (10초로 증가)
        signal: AbortSignal.timeout(10000)
      });

      const isOk = response.ok;
      console.log(`📊 Ollama 서비스 상태: ${isOk ? '사용 가능' : '사용 불가능'} (${response.status})`);
      
      if (!isOk) {
        const errorText = await response.text();
        console.error(`❌ Ollama 서버 오류: ${response.status} ${response.statusText}`, errorText);
      }
      
      return isOk;
    } catch (error) {
      console.error('Ollama 서비스 상태 확인 실패:', error);
      if (error.name === 'AbortError') {
        console.error('⏰ Ollama 서버 응답 타임아웃 - 서버가 실행되지 않거나 느립니다');
      }
      return false;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('모델 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * RAG 기반 전문적인 답변 생성
   */
  async generateProfessionalAnswer(
    query: string,
    context: string,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    
    const prompt = `${systemPrompt}

문서 내용:
${context}

사용자 질문: ${query}

위 문서 내용을 바탕으로 전문적이고 정확한 답변을 제공해주세요.

중요: 반드시 한국어로만 답변하세요. 영어나 다른 언어는 절대 사용하지 마세요.`;

    return await this.callOllamaAPI(prompt, options);
  }

  /**
   * 고품질 답변 생성 (품질 최적화된 설정)
   */
  async generateFastAnswer(
    query: string,
    context: string
  ): Promise<LLMResponse> {
    const qualityOptions: LLMOptions = {
      model: 'qwen2.5:7b', // 품질 중심 모델
      temperature: 0.2, // 일관된 답변
      maxTokens: 1500, // 충분한 길이의 구조화된 답변
      systemPrompt: `당신은 Meta(Facebook, Instagram) 광고 정책과 가이드라인에 대한 전문가입니다.

중요: 반드시 한국어로만 답변하세요. 영어나 다른 언어는 사용하지 마세요.

주어진 문서 내용을 바탕으로 사용자의 질문에 정확하고 전문적인 답변을 제공해주세요.

답변 형식 (한국어로만, 반드시 이 형식을 따라주세요):
**핵심 답변**
[질문에 대한 핵심 답변을 한국어로 제시]

**상세 설명**
[구체적인 설명을 한국어로 제공]

**관련 정책**
[관련 정책이나 주의사항을 한국어로 명시]

**실무 가이드라인**
[필요시 실무 가이드라인을 한국어로 제시]

주의사항:
- 절대 영어나 다른 언어를 사용하지 마세요
- 완전한 문장으로 답변하세요
- 답변을 중간에 끊지 마세요
- 모든 내용을 한국어로만 작성하세요
- 반드시 위의 구조화된 형식을 따라주세요`
    };

    return await this.generateProfessionalAnswer(query, context, qualityOptions);
  }

  /**
   * 간단한 질문 답변 생성
   */
  async generateSimpleAnswer(
    query: string,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const systemPrompt = `당신은 Meta 광고 정책 전문가입니다. 사용자의 질문에 정확하고 도움이 되는 답변을 한국어로 제공해주세요.`;
    
    const prompt = `${systemPrompt}

질문: ${query}

답변:`;

    return await this.callOllamaAPI(prompt, options);
  }

  /**
   * 답변 신뢰도 계산
   */
  private calculateConfidence(response: string): number {
    if (!response || response.length < 10) return 0.1;
    
    // 답변 길이 기반 신뢰도
    let confidence = 0.5;
    
    // 구체적인 정보가 포함된 경우 신뢰도 증가
    if (response.includes('정책') || response.includes('가이드라인')) confidence += 0.1;
    if (response.includes('Meta') || response.includes('Facebook') || response.includes('Instagram')) confidence += 0.1;
    if (response.includes('광고') || response.includes('advertising')) confidence += 0.1;
    
    // 불확실한 표현이 있는 경우 신뢰도 감소
    if (response.includes('모르겠습니다') || response.includes('확실하지 않습니다')) confidence -= 0.2;
    if (response.includes('추측') || response.includes('아마도')) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }

  /**
   * 답변 품질 검증
   */
  validateAnswer(answer: string, query: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    console.log('🔍 답변 품질 검증 시작:', { answer: answer.substring(0, 100) + '...', query });
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 기본 검증
    if (!answer || answer.trim().length < 10) {
      issues.push('답변이 너무 짧습니다.');
      suggestions.push('더 구체적인 답변을 제공해주세요.');
    }

    if (answer.includes('죄송합니다') && answer.includes('오류')) {
      issues.push('오류 메시지가 포함되어 있습니다.');
      suggestions.push('정상적인 답변을 생성해주세요.');
    }

    // 한국어 비율 확인
    const koreanChars = (answer.match(/[\u3131-\u3163\uac00-\ud7a3]/g) || []).length;
    const totalChars = answer.replace(/\s/g, '').length;
    const koreanRatio = totalChars > 0 ? koreanChars / totalChars : 0;

    // 영어 비율 확인
    const englishChars = (answer.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = totalChars > 0 ? englishChars / totalChars : 0;

    // 한국어 답변 품질 검증 (구조화된 답변 기준)
    if (koreanRatio >= 0.7 && englishRatio <= 0.3) {
      // 한국어가 70% 이상이고 영어가 30% 이하면 품질이 좋다고 판단
      const hasStructure = answer.includes('**') && (answer.includes('핵심') || answer.includes('상세') || answer.includes('정책'));
      const hasContent = answer.length > 100; // 충분한 길이의 답변
      
      if (hasStructure && hasContent) {
        return {
          isValid: true,
          issues: [],
          suggestions: []
        };
      }
    }

    // 언어 관련 이슈 (구조화된 답변 기준)
    if (koreanRatio < 0.5) {
      issues.push('답변이 한국어로 작성되지 않았습니다.');
      suggestions.push('한국어로 답변해주세요.');
    }

    if (englishRatio > 0.5) {
      issues.push('답변에 영어가 너무 많이 포함되어 있습니다.');
      suggestions.push('한국어로 답변해주세요.');
    }

    // 구조 관련 이슈 (구조화된 답변 필수)
    if (!answer.includes('**') && !answer.includes('핵심') && !answer.includes('상세') && !answer.includes('정책')) {
      issues.push('답변이 구조화되지 않았습니다.');
      suggestions.push('구조화된 형식으로 답변해주세요.');
    }

    // 관련성 검증 (더 관대하게)
    const queryKeywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const answerKeywords = answer.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const relevantKeywords = queryKeywords.filter(keyword => 
      answerKeywords.some(answerKeyword => 
        answerKeyword.includes(keyword) || keyword.includes(answerKeyword)
      )
    );

    if (relevantKeywords.length < queryKeywords.length * 0.2) {
      issues.push('질문과 답변의 관련성이 낮습니다.');
      suggestions.push('질문과 더 관련된 내용으로 답변해주세요.');
    }

    const result = {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
    
    console.log('🔍 답변 품질 검증 결과:', {
      isValid: result.isValid,
      issues: result.issues,
      koreanRatio: totalChars > 0 ? (koreanChars / totalChars).toFixed(2) : 0,
      englishRatio: totalChars > 0 ? (englishChars / totalChars).toFixed(2) : 0,
      answerLength: answer.length
    });
    
    return result;
  }
}

export const llmService = new LLMService();
