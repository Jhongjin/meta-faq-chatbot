const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'src/app/api/admin/monitoring/route.ts',
  'src/app/api/admin/users/permissions/route.ts',
  'src/app/api/admin/users/check-admin/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/migrate/route.ts',
  'src/app/api/admin/sync-status/route.ts',
  'src/app/api/sync-document-status/route.ts',
  'src/app/api/fix-invalid-embeddings/route.ts',
  'src/app/api/clean-remaining-wiki/route.ts',
  'src/app/api/final-wiki-cleanup/route.ts',
  'src/app/api/delete-wiki-data/route.ts',
  'src/app/api/check-database/route.ts',
  'src/app/api/test-rag-search/route.ts',
  'src/app/api/emergency-fix-embeddings/route.ts',
  'src/app/api/check-schema/route.ts',
  'src/app/api/debug-db-save/route.ts',
  'src/app/api/use-existing-vector-column/route.ts'
];

function fixEnvVars(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 기존 패턴 찾기
    const oldPattern = /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\);?/;
    
    if (oldPattern.test(content)) {
      // 새로운 패턴으로 교체
      const newPattern = `// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}`;
      
      content = content.replace(oldPattern, newPattern);
      
      // 함수 시작 부분에 Supabase 클라이언트 확인 추가
      const functionPattern = /(export async function (GET|POST|PUT|DELETE)\([^)]*\)\s*\{)/;
      if (functionPattern.test(content)) {
        content = content.replace(functionPattern, (match, funcStart) => {
          return `${funcStart}
    // Supabase 클라이언트 확인
    if (!supabase) {
      return NextResponse.json(
        { error: '데이터베이스 연결이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }`;
        });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    console.log(`⏭️  Skipped: ${filePath} (no pattern found)`);
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing environment variable issues in API routes...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixEnvVars(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} out of ${filesToFix.length} files`);
