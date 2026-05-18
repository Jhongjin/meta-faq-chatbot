import { createPureClient } from '../src/lib/supabase/pure';
import * as dotenv from 'dotenv';
import path from 'path';
import { OpenAIEmbeddingService } from '../src/lib/services/OpenAIEmbeddingService';

async function run() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    
    console.log('🚀 P1 & P3 작업 시작...');
    const supabase = await createPureClient();
    const openAIEmbeddingService = new OpenAIEmbeddingService();

    // ----------------------------------------------------
    // P3: 파일 임베딩 누락분 점검
    // ----------------------------------------------------
    console.log('\n🔍 [P3] 파일 임베딩 누락분 점검 중...');
    const { count: missingEmbeddingsCount, error: countError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>sourceType', 'file')
        .is('embedding', null);

    if (countError) {
        console.error('❌ 파일 임베딩 누락분 점검 실패:', countError);
    } else {
        console.log(`✅ 임베딩이 누락된 파일 청크 수: ${missingEmbeddingsCount}개`);
    }

    // ----------------------------------------------------
    // P1: 파워링크 정규화 및 재임베딩
    // ----------------------------------------------------
    console.log('\n🔍 [P1] "파워 링크" 또는 "PowerLink" 포함 문서 검색 중...');
    
    // 파워 링크 검색
    const { data: spaceDocs, error: spaceErr } = await supabase
        .from('documents')
        .select('id, content, metadata')
        .ilike('content', '%파워 링크%');
        
    // PowerLink 검색
    const { data: engDocs, error: engErr } = await supabase
        .from('documents')
        .select('id, content, metadata')
        .ilike('content', '%PowerLink%');
        
    if (spaceErr || engErr) {
        console.error('❌ 검색 중 오류 발생:', spaceErr || engErr);
        return;
    }

    const allDocs = [...(spaceDocs || []), ...(engDocs || [])];
    
    // 중복 제거
    const uniqueDocsMap = new Map();
    allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));
    const uniqueDocs = Array.from(uniqueDocsMap.values());
    
    console.log(`✅ 발견된 문서: ${uniqueDocs.length}개`);

    if (uniqueDocs.length > 0) {
        console.log('🔄 정규화 및 재임베딩 시작...');
        let successCount = 0;
        
        for (const doc of uniqueDocs) {
            const newContent = doc.content
                .replace(/파워 링크/g, '파워링크')
                .replace(/PowerLink/gi, '파워링크');
                
            if (newContent !== doc.content) {
                try {
                    // 새 임베딩 생성
                    const { embedding } = await openAIEmbeddingService.generateEmbedding(newContent);
                    
                    // DB 업데이트
                    const { error: updateError } = await supabase
                        .from('documents')
                        .update({ 
                            content: newContent,
                            embedding: embedding,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', doc.id);
                        
                    if (updateError) {
                        console.error(`❌ 문서 ${doc.id} 업데이트 실패:`, updateError);
                    } else {
                        successCount++;
                        console.log(`✅ 문서 ${doc.id} 업데이트 성공 (${successCount}/${uniqueDocs.length})`);
                    }
                } catch (error) {
                    console.error(`❌ 문서 ${doc.id} 임베딩 생성 실패:`, error);
                }
            } else {
                console.log(`⚠️ 문서 ${doc.id}는 변경할 내용이 없습니다.`);
            }
        }
        
        console.log(`🎉 파워링크 정규화 완료 (총 ${successCount}개 업데이트)`);
    }

    console.log('\n✨ 모든 작업이 완료되었습니다.');
}

run().catch(console.error);
