const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDocumentTitles() {
  try {
    console.log('🔍 URL 문서 조회 중...');
    
    // 모든 URL 문서 조회
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('type', 'url');

    if (fetchError) {
      console.error('❌ 문서 조회 오류:', fetchError);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('ℹ️ 처리할 문서가 없습니다.');
      return;
    }

    console.log(`📋 ${documents.length}개 문서 발견`);

    let updatedCount = 0;
    const errors = [];

    // 각 문서의 제목에서 URL 정보 제거
    for (const doc of documents) {
      try {
        console.log(`\n📄 처리 중: ${doc.title}`);
        
        // 괄호와 그 안의 URL 정보 제거
        const cleanTitle = doc.title.replace(/\s*\([^)]*\)$/, '');
        
        if (cleanTitle !== doc.title) {
          console.log(`  ✂️ 정리: ${doc.title} → ${cleanTitle}`);
          
          // documents 테이블 업데이트
          const { error: docError } = await supabase
            .from('documents')
            .update({ title: cleanTitle })
            .eq('id', doc.id);

          if (docError) {
            console.error(`  ❌ 문서 업데이트 오류:`, docError);
            errors.push(`문서 ${doc.id}: ${docError.message}`);
            continue;
          }

          // document_metadata 테이블도 업데이트
          const { error: metaError } = await supabase
            .from('document_metadata')
            .update({ title: cleanTitle })
            .eq('id', doc.id);

          if (metaError) {
            console.error(`  ❌ 메타데이터 업데이트 오류:`, metaError);
            errors.push(`메타데이터 ${doc.id}: ${metaError.message}`);
          }

          updatedCount++;
          console.log(`  ✅ 완료`);
        } else {
          console.log(`  ℹ️ 변경사항 없음`);
        }
      } catch (error) {
        console.error(`  ❌ 문서 ${doc.id} 처리 오류:`, error);
        errors.push(`문서 ${doc.id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 제목 정리 완료: ${updatedCount}개 문서 업데이트`);
    
    if (errors.length > 0) {
      console.log(`\n❌ 오류 발생:`);
      errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ 제목 정리 오류:', error);
  }
}

// 스크립트 실행
cleanDocumentTitles();
