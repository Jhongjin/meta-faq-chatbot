const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Supabase 데이터베이스 스키마 확인 중...');

    const supabaseUrl = "https://renjseslaqgfoxslxlyu.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbmpzZXNsYXFnZm94c2x4bHl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc4ODQ0MCwiZXhwIjoyMDcyMzY0NDQwfQ.ZP-psPigdwWdWQxUbiCeJo9C2Gb5j9fALtQOcIrmaWI";

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 임베딩 차원 테스트를 통해 스키마 확인...');

    // 기존 임베딩 데이터 확인
    const { data: chunksData, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .limit(1);

    if (chunksError) {
      console.error('❌ 청크 데이터 조회 실패:', chunksError);
      return;
    }

    if (chunksData && chunksData.length > 0) {
      const embedding = chunksData[0].embedding;
      console.log('📊 기존 임베딩 차원:', embedding ? embedding.length : 'null');
    } else {
      console.log('📊 기존 임베딩 데이터 없음');
    }

    // 테스트용 임베딩 삽입 시도 (1024차원)
    console.log('🧪 1024차원 임베딩 삽입 테스트...');
    const testEmbedding = new Array(1024).fill(0.1);
    
    const { data: testData, error: testError } = await supabase
      .from('document_chunks')
      .insert({
        document_id: 'test_doc',
        chunk_id: 'test_chunk',
        content: 'test content',
        embedding: testEmbedding
      })
      .select();

    if (testError) {
      console.error('❌ 1024차원 임베딩 삽입 실패:', testError.message);
      
      // 1536차원으로 시도
      console.log('🧪 1536차원 임베딩 삽입 테스트...');
      const testEmbedding1536 = new Array(1536).fill(0.1);
      
      const { data: testData1536, error: testError1536 } = await supabase
        .from('document_chunks')
        .insert({
          document_id: 'test_doc_1536',
          chunk_id: 'test_chunk_1536',
          content: 'test content 1536',
          embedding: testEmbedding1536
        })
        .select();

      if (testError1536) {
        console.error('❌ 1536차원 임베딩 삽입도 실패:', testError1536.message);
      } else {
        console.log('✅ 1536차원 임베딩 삽입 성공 - 데이터베이스는 1536차원을 기대함');
        // 테스트 데이터 삭제
        await supabase.from('document_chunks').delete().eq('document_id', 'test_doc_1536');
      }
    } else {
      console.log('✅ 1024차원 임베딩 삽입 성공 - 데이터베이스는 1024차원을 기대함');
      // 테스트 데이터 삭제
      await supabase.from('document_chunks').delete().eq('document_id', 'test_doc');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkDatabaseSchema();
