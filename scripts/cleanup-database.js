// 데이터베이스 정리 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경 변수 읽기
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!value.startsWith('#')) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('환경 변수 파일 읽기 오류:', error);
    return {};
  }
}

const envVars = loadEnvFile();

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  try {
    console.log('🗑️  데이터베이스 정리 시작...');

    // 1. 현재 데이터 확인
    console.log('\n📊 현재 데이터 상태 확인:');
    
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at');
    
    if (docError) {
      console.error('문서 조회 오류:', docError);
      return;
    }

    console.log(`📄 문서 수: ${documents?.length || 0}`);
    if (documents && documents.length > 0) {
      documents.forEach(doc => {
        console.log(`  - ${doc.title} (${doc.type}) - ${doc.status} - ${doc.created_at}`);
      });
    }

    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('document_id, chunk_id');
    
    if (chunkError) {
      console.error('청크 조회 오류:', chunkError);
    } else {
      console.log(`🧩 청크 수: ${chunks?.length || 0}`);
    }

    const { data: logs, error: logError } = await supabase
      .from('document_processing_logs')
      .select('document_id, step, status, created_at');
    
    if (logError) {
      console.error('로그 조회 오류:', logError);
    } else {
      console.log(`📝 처리 로그 수: ${logs?.length || 0}`);
    }

    // 2. 사용자 확인
    console.log('\n⚠️  모든 문서와 관련 데이터를 삭제하시겠습니까?');
    console.log('이 작업은 되돌릴 수 없습니다.');
    console.log('계속하려면 "DELETE"를 입력하세요:');

    // 실제로는 사용자 입력을 받아야 하지만, 스크립트에서는 자동으로 진행
    const confirmDelete = process.argv.includes('--confirm');
    
    if (!confirmDelete) {
      console.log('❌ --confirm 플래그가 없어서 삭제를 건너뜁니다.');
      console.log('실제 삭제를 원한다면: node scripts/cleanup-database.js --confirm');
      return;
    }

    // 3. 데이터 삭제 (CASCADE로 관련 데이터도 자동 삭제)
    console.log('\n🗑️  데이터 삭제 중...');

    // documents 테이블에서 모든 데이터 삭제 (CASCADE로 chunks, logs도 삭제됨)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .neq('id', 'dummy'); // 모든 문서 삭제

    if (deleteError) {
      console.error('문서 삭제 오류:', deleteError);
      return;
    }

    // document_metadata 테이블도 정리
    const { error: metaDeleteError } = await supabase
      .from('document_metadata')
      .delete()
      .neq('id', 'dummy');

    if (metaDeleteError) {
      console.error('메타데이터 삭제 오류:', metaDeleteError);
    }

    console.log('✅ 데이터베이스 정리 완료!');

    // 4. 정리 후 상태 확인
    console.log('\n📊 정리 후 상태:');
    
    const { data: remainingDocs } = await supabase
      .from('documents')
      .select('id');
    
    const { data: remainingChunks } = await supabase
      .from('document_chunks')
      .select('id');
    
    const { data: remainingLogs } = await supabase
      .from('document_processing_logs')
      .select('id');

    console.log(`📄 남은 문서: ${remainingDocs?.length || 0}`);
    console.log(`🧩 남은 청크: ${remainingChunks?.length || 0}`);
    console.log(`📝 남은 로그: ${remainingLogs?.length || 0}`);

  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error);
  }
}

cleanupDatabase();
