const fs = require('fs');
const path = require('path');

// 모든 API 라우트 파일 찾기
function findApiRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findApiRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 모든 API 라우트 파일 찾기
const apiRouteFiles = findApiRouteFiles('src/app/api');

console.log(`🔍 Found ${apiRouteFiles.length} API route files`);

function fixEnvVars(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 패턴 1: const supabase = createClient(process.env.XXX!, process.env.YYY!);
    const pattern1 = /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*\);?/;
    
    if (pattern1.test(content)) {
      const newPattern = `// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}`;
      
      content = content.replace(pattern1, newPattern);
      modified = true;
    }
    
    // 패턴 2: const supabaseUrl = process.env.XXX!; const supabaseKey = process.env.YYY!; const supabase = createClient(supabaseUrl, supabaseKey);
    const pattern2 = /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!;\s*const supabaseKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!;\s*const supabase = createClient\(supabaseUrl, supabaseKey\);?/;
    
    if (pattern2.test(content)) {
      const newPattern = `// 환경 변수 확인 및 조건부 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}`;
      
      content = content.replace(pattern2, newPattern);
      modified = true;
    }
    
    // 함수에 Supabase 클라이언트 확인 추가
    if (modified) {
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
    }
    
    if (modified) {
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

console.log('🔧 Fixing environment variable issues in all API routes...\n');

let fixedCount = 0;
apiRouteFiles.forEach(file => {
  if (fixEnvVars(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} out of ${apiRouteFiles.length} files`);
