/**
 * 프롬프트 빌더
 * 모듈화된 프롬프트 컴포넌트를 조합하여 최종 프롬프트 생성
 *
 * 목적:
 * - 프롬프트 구조 개선으로 유지보수성 향상
 * - 할루시네이션 방지 규칙 중앙 관리
 * - 벤더별 템플릿 지원
 *
 * 변경 이력:
 * - [개선 1] 중복 규칙 제거: 잘린 숫자 경고를 buildHallucinationPreventionRules() 한 곳에만 유지
 * - [개선 2] isSimpleQuery()에 숫자/금액 관련 예외 처리 추가 + 정규식 기반 어미 판별
 * - [개선 3] buildReferenceDocuments() 청크 절삭 시 -1 인덱스 버그 수정 + 타입 안전성 강화
 * - [개선 4] TypeScript strict 타입 가드 적용 (filter: doc is string)
 * - [개선 5] buildAnswerFormatGuidelines()에 renderMode 파라미터 추가
 * - [개선 6] buildClarificationPrompt() 출력 제어 강화
 * - [개선 7] buildPrompt() 섹션 순서 재배치: 핵심 규칙 → 참고 문서 → 포맷 → 질문
 */

// SearchResult 타입은 chat/route.ts와 호환되도록 정의
export interface SearchResult {
  id?: string;
  content: string;
  similarity?: number;
  documentId?: string;
  documentTitle?: string;
  documentUrl?: string;
  url?: string;
  chunkIndex?: number;
  sourceVendor?: string;
  metadata?: any;
}

export interface PromptComponents {
  hallucinationPrevention?: string;
  documentBasedAnswer?: string;
  vendorSpecificGuidelines?: string;
  answerFormat?: string;
  questionKeywords?: string[];
  excludedSources?: string[];
  suspiciousNumberPatterns?: string[];
}

export interface PromptBuilderOptions {
  query: string;
  originalQuery?: string;
  searchResults: SearchResult[];
  vendors?: string[];
  components?: PromptComponents;
  /** 답변 렌더링 환경. 기본값: 'markdown' */
  renderMode?: 'markdown' | 'plain';
}

export class PromptBuilder {
  // ─────────────────────────────────────────────
  // [개선 1] 할루시네이션 방지 규칙 — 중복 제거 후 단일 출처로 관리
  // 잘린 숫자 경고는 이 메서드에서만 명시하고, buildFinalChecklist와
  // buildPrompt의 리마인드 줄에서는 제거함.
  // ─────────────────────────────────────────────
  buildHallucinationPreventionRules(): string {
    return `🚨 **할루시네이션 방지 — 엄격한 규칙 (최우선 적용):**

**절대 금지 사항:**
1. **문서 외 정보 사용 금지**: 아래 "참고 문서"에 없는 정보는 절대 사용하지 마세요.
2. **추측·추론 금지**: "아마도", "추정됩니다", "일반적으로" 등의 표현으로 추측하지 마세요.
3. **외부 지식 사용 금지**: 인터넷 검색, 일반 광고 지식, 업계 상식을 사용하지 마세요.
4. **잘린 숫자·금액 사용 금지**:
   - "500만...", "3 | 500만" 처럼 파이프(|)·공백·줄임표로 잘린 숫자는 절대 사용하지 마세요.
   - "숫자 | 숫자" 또는 "숫자 | 문자" 형태는 잘린 텍스트로 간주하고 무시하세요.
   - 문서에 완전한 문장(예: "최소 집행 금액 500만원")으로 명시된 경우에만 사용하세요.

**필수 준수 사항:**
1. **문서 기반 답변만**: "참고 문서" 섹션의 내용만 사용하세요.
2. **모르면 솔직히 말하기**: 문서에 없으면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답변하세요.
3. **인라인 출처 표기 금지**: 답변 본문 내 \`[출처 X]\`, \`(출처 X)\` 등은 절대 사용하지 마세요. 출처는 [참고자료] 섹션에만 작성하세요.
4. **숫자·금액 검증 필수**: 답변에 포함할 모든 숫자는 참고 문서에서 완전한 형태로 명시된 경우에만 사용하세요.`;
  }

  /**
   * 문서 기반 답변 규칙 생성
   */
  buildDocumentBasedAnswerRules(
    query: string,
    originalQuery?: string,
    questionKeywords: string[] = []
  ): string {
    const queryContext =
      originalQuery && originalQuery !== query
        ? `원본 질문: "${originalQuery}"\n추가 답변: "${query}"`
        : `질문: "${query}"`;

    return `**문서 검토 안내:**
- "참고 문서"에 포함된 모든 정보를 충분히 검토하세요.
- 사용자 질문(${queryContext})과 관련된 모든 내용을 찾아 답변에 포함하세요.
- 예를 들어, 질문이 "연동형/비연동형"에 대한 것이라면 "연동형", "비연동형", "지급시점", "정산기준", "단가" 등 관련 키워드가 포함된 내용을 모두 찾아 답변하세요.
- 참고 문서에 관련 정보가 있으면 반드시 답변에 포함하고, "찾을 수 없습니다"라고 답변하지 마세요.

${questionKeywords.length > 0 ? `**질문 핵심 키워드:** ${questionKeywords.join(', ')}\n\n` : ''}`;
  }

  /**
   * 벤더별 가이드라인 생성
   */
  buildVendorSpecificGuidelines(vendors: string[]): string | null {
    if (!vendors || vendors.length === 0) return null;

    const guidelineMap: Record<string, string> = {
      META: '- Meta (Facebook, Instagram, Threads): 각 플랫폼별 정책 차이를 명확히 구분하여 설명하세요.',
      NAVER: '- Naver: 네이버 광고 플랫폼의 특정 기능과 정책을 정확히 반영하세요.',
      KAKAO: '- Kakao: 카카오 비즈보드의 특정 기능과 정책을 정확히 반영하세요.',
      GOOGLE: '- Google: Google Ads의 특정 기능과 정책을 정확히 반영하세요.',
      OTHER: '- X(Twitter): X(Twitter) 광고 정책 및 운영 가이드를 정확히 반영하세요.',
    };

    const guidelines = vendors
      .map((v) => guidelineMap[v])
      .filter((g): g is string => Boolean(g));

    return guidelines.length > 0
      ? `**플랫폼별 특성:**\n${guidelines.join('\n')}\n`
      : null;
  }

  // ─────────────────────────────────────────────
  // [개선 5] renderMode 파라미터 추가
  // 렌더링 환경에 따라 Markdown 구조 지시를 다르게 적용
  // ─────────────────────────────────────────────
  buildAnswerFormatGuidelines(
    query: string,
    originalQuery?: string,
    isSimple: boolean = false,
    renderMode: 'markdown' | 'plain' = 'markdown'
  ): string {
    const queryContext =
      originalQuery && originalQuery !== query
        ? `"${originalQuery}" + "${query}"`
        : `"${query}"`;

    if (isSimple) {
      return `**답변 작성 가이드라인 (단순·확인형 질문용):**

**1. 답변 구조:**
- **핵심 답변**: 질문(${queryContext})에 대해 2~4문장 내외로 간결하고 정확하게 답변하세요.
- **[참고자료]**: 답변의 근거가 된 문서 제목을 중복 없이 나열하세요.

**2. 주의사항:**
- 간결함이 최우선입니다. 불필요한 서론·요약·상세 설명은 생략하세요.`;
    }

    if (renderMode === 'plain') {
      return `**답변 작성 가이드라인 (상세·절차형 질문용 — 일반 텍스트 모드):**

**1. 답변 구조:**
[핵심 요약] 전체 답변을 2줄 이내로 요약하세요.
[핵심 답변] 질문(${queryContext})에 대한 결론과 가장 중요한 내용을 작성하세요.
[상세 설명] 절차나 순서가 있으면 1, 2, 3... 순으로 번호를 매기세요. 범주가 바뀔 때는 소제목을 붙이세요.
[참고자료] 근거가 된 문서를 중복 없이 한 줄씩 나열하세요.

**2. 주의사항:**
- 본문 내 인라인 출처 마커([출처 X])는 절대 사용하지 마세요.
- 번호 매기기 시 1.을 반복하지 마세요.`;
    }

    // renderMode === 'markdown' (기본값)
    return `**답변 작성 가이드라인 (상세·절차형 질문용):**

**1. 답변 구조 (반드시 준수):**

---
### [핵심 요약]
- 전체 답변 내용을 2줄 내외로 요약하세요.

### [핵심 답변]
- 질문(${queryContext})에 대한 **최종 결론과 가장 중요한 내용**을 작성하세요.

### [상세 설명]
- 절차나 순서가 있을 경우 **1, 2, 3... 순서대로 번호**를 매기세요. **절대 1.을 반복하지 마세요.**
- 정보 범주가 바뀔 때는 **소제목(###)**을 사용하고 그 아래에 불렛 포인트(-)로 조직화하세요.

### [참고자료]
- 근거가 된 문서만 포함하세요.
- **중복 제거**: 동일 문서는 문서 제목 기준으로 **한 줄씩만** 나열하세요.
---

**2. 시각적 위계 확보:**
- **인라인 출처 표기 금지**: 본문 중간에 \`[출처 X]\`, \`(출처 X)\` 등을 **절대 삽입하지 마세요.**
- **소제목 의무화**: 정보 구분 시 반드시 \`### 소제목\` 형식을 사용하세요.`;
  }

  // ─────────────────────────────────────────────
  // [개선 3] 청크 절삭 시 -1 인덱스 버그 수정
  // [개선 4] TypeScript 타입 가드 적용 (filter: doc is string)
  // ─────────────────────────────────────────────
  buildReferenceDocuments(
    searchResults: SearchResult[],
    excludedSources: string[] = [],
    suspiciousNumberPatterns: string[] = []
  ): string {
    const validResults = searchResults.filter((result) => {
      const sourceTitle = result.documentTitle || '';
      const isExcluded = excludedSources.some((excluded) =>
        sourceTitle.includes(excluded)
      );
      const hasSuspiciousPattern = suspiciousNumberPatterns.some((pattern) =>
        sourceTitle.includes(pattern)
      );
      return !isExcluded && !hasSuspiciousPattern;
    });

    if (validResults.length === 0) {
      return '**참고 문서:**\n(관련 문서가 없습니다.)\n';
    }

    const MAX_LEN = 800;
    const MIN_SENTENCE_BOUND = Math.floor(MAX_LEN * 0.6); // 480자

    const documents = validResults
      .map((result, index): string | null => {
        let content = result.content || '';
        const title = result.documentTitle || '문서';
        const source =
          result.documentUrl ||
          result.url ||
          result.metadata?.source ||
          '';

        if (content.length > MAX_LEN) {
          const truncated = content.substring(0, MAX_LEN);

          // [개선 3] -1(찾지 못한 경우)을 필터링한 뒤 Math.max 적용
          const sentenceEndCandidates = [
            truncated.lastIndexOf('다. '),
            truncated.lastIndexOf('요. '),
            truncated.lastIndexOf('.\n'),
            truncated.lastIndexOf('. '),
          ].filter((idx) => idx > MIN_SENTENCE_BOUND); // MIN_SENTENCE_BOUND 미만 및 -1 제거

          if (sentenceEndCandidates.length > 0) {
            const lastSentenceEnd = Math.max(...sentenceEndCandidates);
            content =
              truncated.substring(0, lastSentenceEnd + 1) + ' [이하 생략]';
          } else {
            // 문장 종결점을 찾지 못하면 신뢰도가 낮으므로 해당 청크 제외
            return null;
          }
        }

        return `[출처 ${index + 1}] ${title}${source ? ` (${source})` : ''}\n${content}`;
      })
      // [개선 4] TypeScript strict 타입 가드
      .filter((doc): doc is string => doc !== null)
      .join('\n\n---\n\n');

    return `**참고 문서:**\n\n${documents || '(신뢰할 수 있는 참고 문장이 부족하여 제외되었습니다.)'
      }\n\n`;
  }

  // ─────────────────────────────────────────────
  // [개선 2] isSimpleQuery() 개선
  // - 숫자/금액 관련 키워드가 포함되면 무조건 상세형 (할루시네이션 위험)
  // - 복잡 키워드 포함 시 무조건 상세형
  // - 단순형 어미를 하드코딩 문자열 대신 정규식으로 판별 → 어미 변형 대응
  // ─────────────────────────────────────────────
  private isSimpleQuery(query: string): boolean {
    const complexKeywords = [
      '방법', '절차', '가이드', '차이', '비교', '설명', '특징', '이유', '어떻게',
    ];
    if (complexKeywords.some((k) => query.includes(k))) return false;

    // 숫자·금액 관련이면 상세형 강제 (할루시네이션 위험 높음)
    const numberRelatedKeywords = [
      '얼마', '금액', '비용', '요금', '단가', '예산', '최소', '최대',
    ];
    if (numberRelatedKeywords.some((k) => query.includes(k))) return false;

    // 단순 확인형 어미를 정규식으로 판별 (어미 변형 대응)
    const simplePatterns = [
      /있나요\??$/,
      /인가요\??$/,
      /입니까\??$/,
      /있습니까\??$/,
      /되나요\??$/,
      /되나요\??$/,
      /인지요\??$/,
    ];

    return query.length < 30 && simplePatterns.some((p) => p.test(query));
  }

  // ─────────────────────────────────────────────
  // [개선 1] 체크리스트에서 잘린 숫자 경고 제거
  // 중복 규칙을 제거하고 핵심 체크 항목만 유지
  // ─────────────────────────────────────────────
  buildFinalChecklist(query: string): string {
    return `**답변 전 최종 확인 체크리스트:**
1. 답변에 포함된 모든 정보가 "참고 문서"에 정확히 명시되어 있는가?
2. 답변 본문 내에 인라인 출처 마커([출처 X])가 절대 포함되지 않았는가?
3. 질문("${query}")의 의도에 직결되는 정보 위주로 작성되었는가?
4. 문서에 없는 내용을 상식이나 추측으로 보완하지 않았는가?`;
  }

  // ─────────────────────────────────────────────
  // [개선 7] buildPrompt() 섹션 순서 재배치
  // LLM은 프롬프트 앞부분과 끝부분에 집중하는 경향이 있으므로:
  // 핵심 규칙(할루시네이션 방지) → 참고 문서 → 문서 검토 안내
  // → 벤더 가이드라인 → 답변 형식 → 체크리스트 → 질문
  // ─────────────────────────────────────────────
  buildPrompt(options: PromptBuilderOptions): string {
    const {
      query,
      originalQuery,
      searchResults,
      vendors = [],
      components = {},
      renderMode = 'markdown',
    } = options;

    const isSimple = this.isSimpleQuery(query);

    // 1. 핵심 규칙 (프롬프트 최상단 — LLM 주의 집중 극대화)
    const hallucinationPrevention =
      components.hallucinationPrevention ||
      this.buildHallucinationPreventionRules();

    // 2. 참고 문서
    const referenceDocuments = this.buildReferenceDocuments(
      searchResults,
      components.excludedSources || [],
      components.suspiciousNumberPatterns || []
    );

    // 3. 문서 검토 안내
    const documentBasedAnswer =
      components.documentBasedAnswer ||
      this.buildDocumentBasedAnswerRules(
        query,
        originalQuery,
        components.questionKeywords
      );

    // 4. 벤더별 가이드라인
    const vendorGuidelines =
      components.vendorSpecificGuidelines ||
      this.buildVendorSpecificGuidelines(vendors);

    // 5. 답변 형식 가이드라인 (renderMode 전달)
    const answerFormat =
      components.answerFormat ||
      this.buildAnswerFormatGuidelines(query, originalQuery, isSimple, renderMode);

    // 6. 최종 체크리스트 (프롬프트 후반부 — LLM 주의 집중 재강조)
    const finalChecklist = this.buildFinalChecklist(query);

    // 프롬프트 조합
    let prompt = `${hallucinationPrevention}\n\n`;
    prompt += `${referenceDocuments}\n\n`;
    prompt += `${documentBasedAnswer}\n\n`;

    if (vendorGuidelines) {
      prompt += `${vendorGuidelines}\n\n`;
    }

    prompt += `${answerFormat}\n\n`;
    prompt += `${finalChecklist}\n\n`;
    prompt += `답변:`;

    return prompt;
  }

  // ─────────────────────────────────────────────
  // [개선 6] buildClarificationPrompt() 출력 제어 강화
  // - 서문·이유 설명 없이 질문 한 줄만 출력하도록 지시 강화
  // ─────────────────────────────────────────────
  buildClarificationPrompt(query: string, options: string[]): string {
    return `당신은 사용자의 질문이 여러 상품에 해당할 때, 어떤 상품에 대해 알고 싶은지 정중하게 되묻는 AI 조수입니다.

**사용자 질문:** ${query}
**감지된 선택지:** ${options.join(', ')}

**미션:**
사용자가 위 선택지 중 하나를 선택할 수 있도록 유도하는 재확인 질문을 1줄로 작성하세요.

**작성 가이드라인:**
1. **간결성**: 부연 설명 없이 질문만 명확하게 작성하세요.
2. **친절함**: 전문적이고 정중한 톤을 유지하세요.
3. **명확성**: 선택지들이 무엇인지 질문에 포함하세요.
4. **출력 형식**: 오직 질문 텍스트만 출력하세요. 서문, 이유 설명, 마침표 이후 추가 문장 없이 질문 한 줄만 출력합니다.
   - 올바른 예시: "네이버 검색광고와 파워링크 중 어느 상품에 대해 안내해 드릴까요?"
   - 잘못된 예시: "알겠습니다. 사용자의 질문이 두 상품에 해당하므로 다음과 같이 질문하겠습니다: ..."

위 지시에 따라 질문 텍스트만 출력하세요.

질문:`;
  }
}

// 싱글톤 인스턴스
export const promptBuilder = new PromptBuilder();