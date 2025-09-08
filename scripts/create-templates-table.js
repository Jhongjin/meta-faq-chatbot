const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTemplatesTable() {
  try {
    console.log('🔧 URL 템플릿 테이블 생성 중...');
    
    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS url_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        urls TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // 테이블 생성
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ 테이블 생성 오류:', createError);
      return;
    }
    
    console.log('✅ 테이블 생성 완료');
    
    // 기본 데이터 삽입
    console.log('📝 기본 템플릿 데이터 삽입 중...');
    
    const defaultTemplates = [
      { name: 'Facebook Business (한국어)', urls: ['https://ko-kr.facebook.com/business'] },
      { name: 'Instagram Business (한국어)', urls: ['https://business.instagram.com/help/ko/'] },
      { name: 'Meta 개발자 문서 (한국어)', urls: ['https://developers.facebook.com/docs/marketing-api/ko/'] },
      { name: 'Facebook Help (영어)', urls: ['https://www.facebook.com/help/'] },
      { name: 'Facebook Business (영어)', urls: ['https://www.facebook.com/business/help/'] },
      { name: 'Instagram Business (영어)', urls: ['https://business.instagram.com/help/'] },
      { name: 'Meta 개발자 문서 (영어)', urls: ['https://developers.facebook.com/docs/marketing-api/'] }
    ];
    
    const { error: insertError } = await supabase
      .from('url_templates')
      .upsert(defaultTemplates, { onConflict: 'name' });
    
    if (insertError) {
      console.error('❌ 데이터 삽입 오류:', insertError);
      return;
    }
    
    console.log('✅ 기본 템플릿 데이터 삽입 완료');
    
    // 결과 확인
    const { data: templates, error: selectError } = await supabase
      .from('url_templates')
      .select('*');
    
    if (selectError) {
      console.error('❌ 데이터 조회 오류:', selectError);
      return;
    }
    
    console.log(`🎉 완료! ${templates.length}개 템플릿이 생성되었습니다.`);
    templates.forEach(template => {
      console.log(`  - ${template.name}: ${template.urls.length}개 URL`);
    });
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

// 스크립트 실행
createTemplatesTable();
