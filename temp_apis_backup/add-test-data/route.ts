import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OllamaEmbeddingService } from '@/lib/services/OllamaEmbeddingService';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경 변수가 설정되지 않았습니다.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 테스트 문서 데이터
    const testDocuments = [
      {
        id: 'meta-ad-policy-2024',
        title: '메타 광고 정책 2024',
        type: 'file',
        status: 'indexed',
        content: `메타 광고 정책 2024

**1. 광고 콘텐츠 가이드라인**
- 광고는 정확하고 공정해야 합니다
- 부적절하거나 모욕적인 내용은 금지됩니다
- 사용자를 속이거나 혼란스럽게 만드는 것은 허용되지 않습니다

**2. 개인정보 보호**
- 사용자의 개인 정보를 수집할 때는 반드시 동의를 얻어야 합니다
- 관련 법률을 준수해야 합니다
- 데이터 보안을 최우선으로 고려해야 합니다

**3. 광고주의 의무**
- 상품이나 서비스에 대한 정확한 정보를 제공해야 합니다
- 허위 또는 과장된 내용은 금지됩니다
- 투명한 광고 운영이 필요합니다

**4. 금지 사항**
- 성인 콘텐츠, 폭력, 혐오 발언
- 허위 정보 및 미신
- 개인정보 수집 및 오남용
- 의료, 금융 관련 허위 광고`
      },
      {
        id: 'instagram-ad-specs',
        title: '인스타그램 광고 사양',
        type: 'file',
        status: 'indexed',
        content: `인스타그램 광고 사양 가이드

**스토리 광고**
- 크기: 1080x1920 픽셀 (9:16 비율)
- 최대 파일 크기: 30MB
- 지원 형식: MP4, MOV
- 최대 길이: 15초

**피드 광고**
- 크기: 1080x1080 픽셀 (1:1 비율)
- 최대 파일 크기: 30MB
- 지원 형식: MP4, MOV
- 최대 길이: 60초

**릴스 광고**
- 크기: 1080x1920 픽셀 (9:16 비율)
- 최대 파일 크기: 30MB
- 지원 형식: MP4, MOV
- 최대 길이: 90초

**텍스트 제한**
- 제목: 최대 30자
- 설명: 최대 2,200자
- 해시태그: 최대 30개`
      },
      {
        id: 'facebook-ad-policy',
        title: '페이스북 광고 정책',
        type: 'file',
        status: 'indexed',
        content: `페이스북 광고 정책

**이미지 광고**
- 크기: 1200x628 픽셀 (1.91:1 비율)
- 최대 파일 크기: 30MB
- 지원 형식: JPG, PNG
- 텍스트 제한: 이미지의 20% 이하

**동영상 광고**
- 크기: 1280x720 픽셀 (16:9 비율)
- 최대 파일 크기: 4GB
- 지원 형식: MP4, MOV, AVI
- 최대 길이: 240초

**카루셀 광고**
- 크기: 1080x1080 픽셀 (1:1 비율)
- 최대 파일 크기: 30MB
- 지원 형식: JPG, PNG
- 최대 10개 이미지

**광고 승인 기준**
- 정책 위반 내용 확인
- 이미지/텍스트 수정
- 재심사 요청 가능
- 평균 승인 시간: 24시간`
      }
    ];

    console.log('📝 테스트 데이터 추가 시작...');

    // 임베딩 서비스 초기화
    const embeddingService = new OllamaEmbeddingService();
    await embeddingService.initialize();

    let totalChunks = 0;

    for (const doc of testDocuments) {
      // 1. 문서 저장
      const { error: docError } = await supabase
        .from('documents')
        .upsert({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          status: doc.status,
          chunk_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (docError) {
        console.error(`❌ 문서 저장 실패 (${doc.id}):`, docError);
        continue;
      }

      console.log(`✅ 문서 저장 완료: ${doc.title}`);

      // 2. 텍스트를 청크로 분할 (500자씩)
      const chunkSize = 500;
      const chunks = [];
      for (let i = 0; i < doc.content.length; i += chunkSize) {
        const chunk = doc.content.substring(i, i + chunkSize);
        chunks.push({
          content: chunk,
          index: Math.floor(i / chunkSize)
        });
      }

      // 3. 각 청크에 대해 임베딩 생성 및 저장
      for (const chunk of chunks) {
        try {
          const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
          
          const { error: chunkError } = await supabase
            .from('document_chunks')
            .insert({
              document_id: doc.id,
              chunk_id: `${doc.id}_chunk_${chunk.index}`,
              content: chunk.content,
              embedding: embeddingResult.embedding,
              metadata: {
                title: doc.title,
                type: doc.type,
                chunkIndex: chunk.index
              },
              created_at: new Date().toISOString()
            });

          if (chunkError) {
            console.error(`❌ 청크 저장 실패 (${doc.id}_chunk_${chunk.index}):`, chunkError);
          } else {
            totalChunks++;
          }
        } catch (error) {
          console.error(`❌ 임베딩 생성 실패 (${doc.id}_chunk_${chunk.index}):`, error);
        }
      }

      // 4. 문서의 청크 수 업데이트
      await supabase
        .from('documents')
        .update({ chunk_count: chunks.length })
        .eq('id', doc.id);

      console.log(`✅ 청크 생성 완료: ${doc.title} (${chunks.length}개 청크)`);
    }

    console.log(`🎉 테스트 데이터 추가 완료: ${totalChunks}개 청크`);

    return NextResponse.json({
      success: true,
      message: `테스트 데이터가 성공적으로 추가되었습니다. (${totalChunks}개 청크)`,
      documents: testDocuments.length,
      chunks: totalChunks
    });

  } catch (error) {
    console.error('❌ 테스트 데이터 추가 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
