'use client';

import { createClient } from '@supabase/supabase-js';

export interface EmbeddingValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  canBeFixed: boolean;
}

export interface EmbeddingFixResult {
  success: boolean;
  fixedCount: number;
  errorCount: number;
  errors: Array<{ chunkId: string; error: string }>;
}

export class EmbeddingValidationService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase 환경변수가 설정되지 않았습니다.');
      this.supabase = null;
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 임베딩 데이터 유효성 검사
   */
  async validateEmbeddings(): Promise<EmbeddingValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. 데이터베이스 스키마 확인
      const { data: schemaData, error: schemaError } = await this.supabase
        .rpc('get_table_schema', { table_name: 'document_chunks' });

      if (schemaError) {
        issues.push('데이터베이스 스키마 확인 실패');
      }

      // 2. 임베딩 데이터 샘플 확인
      const { data: chunks, error: chunksError } = await this.supabase
        .from('document_chunks')
        .select('id, embedding, metadata')
        .limit(10);

      if (chunksError) {
        issues.push('임베딩 데이터 조회 실패');
        return { isValid: false, issues, recommendations, canBeFixed: false };
      }

      if (!chunks || chunks.length === 0) {
        issues.push('임베딩 데이터가 없습니다');
        recommendations.push('새로운 문서를 업로드하여 임베딩을 생성하세요');
        return { isValid: false, issues, recommendations, canBeFixed: false };
      }

      // 3. 임베딩 형식 분석
      let stringEmbeddings = 0;
      let arrayEmbeddings = 0;
      let zeroLengthEmbeddings = 0;
      let invalidEmbeddings = 0;

      for (const chunk of chunks) {
        const embedding = chunk.embedding;

        if (typeof embedding === 'string') {
          stringEmbeddings++;
          
          try {
            const parsed = JSON.parse(embedding);
            if (Array.isArray(parsed)) {
              if (parsed.length === 0) {
                zeroLengthEmbeddings++;
              } else if (parsed.length !== 1024) {
                invalidEmbeddings++;
                issues.push(`청크 ${chunk.id}: 차원 수 오류 (${parsed.length}/1024)`);
              }
            } else {
              invalidEmbeddings++;
              issues.push(`청크 ${chunk.id}: 파싱된 데이터가 배열이 아님`);
            }
          } catch (parseError) {
            invalidEmbeddings++;
            issues.push(`청크 ${chunk.id}: JSON 파싱 실패`);
          }
        } else if (Array.isArray(embedding)) {
          arrayEmbeddings++;
          if (embedding.length === 0) {
            zeroLengthEmbeddings++;
          } else if (embedding.length !== 1024) {
            invalidEmbeddings++;
            issues.push(`청크 ${chunk.id}: 차원 수 오류 (${embedding.length}/1024)`);
          }
        } else {
          invalidEmbeddings++;
          issues.push(`청크 ${chunk.id}: 알 수 없는 임베딩 형식`);
        }
      }

      // 4. 문제점 요약
      if (stringEmbeddings > 0) {
        issues.push(`${stringEmbeddings}개 임베딩이 문자열로 저장됨`);
        recommendations.push('문자열 임베딩을 배열로 변환하세요');
      }

      if (zeroLengthEmbeddings > 0) {
        issues.push(`${zeroLengthEmbeddings}개 임베딩이 길이 0임`);
        recommendations.push('길이 0인 임베딩을 재생성하세요');
      }

      if (invalidEmbeddings > 0) {
        issues.push(`${invalidEmbeddings}개 임베딩이 유효하지 않음`);
        recommendations.push('유효하지 않은 임베딩을 수정하세요');
      }

      // 5. 수정 가능성 판단
      const canBeFixed = stringEmbeddings > 0 || (zeroLengthEmbeddings > 0 && arrayEmbeddings > 0);

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
        canBeFixed
      };

    } catch (error) {
      console.error('임베딩 유효성 검사 실패:', error);
      return {
        isValid: false,
        issues: ['유효성 검사 중 오류 발생'],
        recommendations: ['시스템 관리자에게 문의하세요'],
        canBeFixed: false
      };
    }
  }

  /**
   * 임베딩 형식 수정
   */
  async fixEmbeddingFormats(): Promise<EmbeddingFixResult> {
    const result: EmbeddingFixResult = {
      success: false,
      fixedCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      // 1. 모든 청크 조회
      const { data: chunks, error: chunksError } = await this.supabase
        .from('document_chunks')
        .select('id, embedding, metadata');

      if (chunksError) {
        result.errors.push({ chunkId: 'all', error: '청크 조회 실패' });
        return result;
      }

      if (!chunks || chunks.length === 0) {
        result.success = true;
        return result;
      }

      // 2. 각 청크의 임베딩 수정
      for (const chunk of chunks) {
        try {
          let embedding = chunk.embedding;
          let needsUpdate = false;

          // 문자열인 경우 배열로 변환
          if (typeof embedding === 'string') {
            try {
              embedding = JSON.parse(embedding);
              needsUpdate = true;
            } catch (parseError) {
              result.errors.push({ 
                chunkId: chunk.id, 
                error: 'JSON 파싱 실패' 
              });
              result.errorCount++;
              continue;
            }
          }

          // 배열인지 확인
          if (!Array.isArray(embedding)) {
            result.errors.push({ 
              chunkId: chunk.id, 
              error: '배열이 아님' 
            });
            result.errorCount++;
            continue;
          }

          // 길이 확인
          if (embedding.length === 0) {
            result.errors.push({ 
              chunkId: chunk.id, 
              error: '길이 0인 임베딩' 
            });
            result.errorCount++;
            continue;
          }

          // 차원 수 확인
          if (embedding.length !== 1024) {
            result.errors.push({ 
              chunkId: chunk.id, 
              error: `차원 수 오류 (${embedding.length}/1024)` 
            });
            result.errorCount++;
            continue;
          }

          // 숫자 배열인지 확인
          if (!embedding.every(item => typeof item === 'number')) {
            result.errors.push({ 
              chunkId: chunk.id, 
              error: '배열 요소가 모두 숫자가 아님' 
            });
            result.errorCount++;
            continue;
          }

          // 업데이트가 필요한 경우에만 실행
          if (needsUpdate) {
            const { error: updateError } = await this.supabase
              .from('document_chunks')
              .update({ embedding: embedding })
              .eq('id', chunk.id);

            if (updateError) {
              result.errors.push({ 
                chunkId: chunk.id, 
                error: `업데이트 실패: ${updateError.message}` 
              });
              result.errorCount++;
            } else {
              result.fixedCount++;
            }
          }

        } catch (error) {
          result.errors.push({ 
            chunkId: chunk.id, 
            error: `처리 중 오류: ${error}` 
          });
          result.errorCount++;
        }
      }

      result.success = result.errorCount === 0;

    } catch (error) {
      console.error('임베딩 형식 수정 실패:', error);
      result.errors.push({ 
        chunkId: 'system', 
        error: `시스템 오류: ${error}` 
      });
    }

    return result;
  }

  /**
   * 문제가 있는 임베딩 재생성
   */
  async regenerateProblematicEmbeddings(): Promise<EmbeddingFixResult> {
    const result: EmbeddingFixResult = {
      success: false,
      fixedCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      // 1. 문제가 있는 청크 조회
      const { data: chunks, error: chunksError } = await this.supabase
        .from('document_chunks')
        .select('id, content, metadata')
        .or('embedding.is.null,embedding.eq.[]');

      if (chunksError) {
        result.errors.push({ chunkId: 'all', error: '청크 조회 실패' });
        return result;
      }

      if (!chunks || chunks.length === 0) {
        result.success = true;
        return result;
      }

      // 2. 임베딩 서비스 import (동적 import로 순환 참조 방지)
      const { EmbeddingService } = await import('./EmbeddingService');
      const embeddingService = new EmbeddingService();

      // 3. 임베딩 서비스 초기화
      await embeddingService.initialize('bge-m3');

      // 4. 각 청크의 임베딩 재생성
      for (const chunk of chunks) {
        try {
          const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
          
          const { error: updateError } = await this.supabase
            .from('document_chunks')
            .update({ 
              embedding: embeddingResult.embedding,
              metadata: {
                ...chunk.metadata,
                model: embeddingResult.model,
                dimension: embeddingResult.dimension,
                processingTime: embeddingResult.processingTime,
                regenerated: true,
                regeneratedAt: new Date().toISOString()
              }
            })
            .eq('id', chunk.id);

          if (updateError) {
            result.errors.push({ 
              chunkId: chunk.id, 
              error: `업데이트 실패: ${updateError.message}` 
            });
            result.errorCount++;
          } else {
            result.fixedCount++;
          }

        } catch (error) {
          result.errors.push({ 
            chunkId: chunk.id, 
            error: `임베딩 생성 실패: ${error}` 
          });
          result.errorCount++;
        }
      }

      result.success = result.errorCount === 0;

    } catch (error) {
      console.error('문제 임베딩 재생성 실패:', error);
      result.errors.push({ 
        chunkId: 'system', 
        error: `시스템 오류: ${error}` 
      });
    }

    return result;
  }

  /**
   * 임베딩 통계 조회
   */
  async getEmbeddingStats(): Promise<{
    totalChunks: number;
    validEmbeddings: number;
    invalidEmbeddings: number;
    stringEmbeddings: number;
    arrayEmbeddings: number;
    zeroLengthEmbeddings: number;
  }> {
    try {
      const { data: chunks, error } = await this.supabase
        .from('document_chunks')
        .select('id, embedding');

      if (error || !chunks) {
        throw new Error('청크 조회 실패');
      }

      let validEmbeddings = 0;
      let invalidEmbeddings = 0;
      let stringEmbeddings = 0;
      let arrayEmbeddings = 0;
      let zeroLengthEmbeddings = 0;

      for (const chunk of chunks) {
        const embedding = chunk.embedding;

        if (typeof embedding === 'string') {
          stringEmbeddings++;
          try {
            const parsed = JSON.parse(embedding);
            if (Array.isArray(parsed) && parsed.length === 1024) {
              validEmbeddings++;
            } else {
              invalidEmbeddings++;
              if (parsed.length === 0) zeroLengthEmbeddings++;
            }
          } catch {
            invalidEmbeddings++;
          }
        } else if (Array.isArray(embedding)) {
          arrayEmbeddings++;
          if (embedding.length === 1024) {
            validEmbeddings++;
          } else {
            invalidEmbeddings++;
            if (embedding.length === 0) zeroLengthEmbeddings++;
          }
        } else {
          invalidEmbeddings++;
        }
      }

      return {
        totalChunks: chunks.length,
        validEmbeddings,
        invalidEmbeddings,
        stringEmbeddings,
        arrayEmbeddings,
        zeroLengthEmbeddings
      };

    } catch (error) {
      console.error('임베딩 통계 조회 실패:', error);
      throw error;
    }
  }
}
