import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '@/lib/services/EmbeddingService';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const embeddingService = new EmbeddingService();
    await embeddingService.initialize('bge-m3');

    // 1. Generate a test embedding
    const testText = "페이스북 광고 정책";
    const testEmbedding = await embeddingService.generateEmbedding(testText);
    
    console.log('✅ Test embedding generated:', {
      dimension: testEmbedding.dimension,
      length: testEmbedding.embedding.length,
      firstFewValues: testEmbedding.embedding.slice(0, 5)
    });

    // 2. Check existing embeddings in database
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, chunk_id, embedding, content')
      .limit(5);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const embeddingAnalysis = chunks?.map(chunk => {
      const embedding = chunk.embedding;
      let analysis = {
        id: chunk.id,
        chunk_id: chunk.chunk_id,
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: 0,
        hasValidValues: false,
        firstFewValues: [],
        issues: []
      };

      if (typeof embedding === 'string') {
        try {
          const parsed = JSON.parse(embedding);
          if (Array.isArray(parsed)) {
            analysis.length = parsed.length;
            analysis.firstFewValues = parsed.slice(0, 5);
            analysis.hasValidValues = parsed.some(val => val !== 0);
            if (parsed.length === 0) analysis.issues.push('Empty array');
            if (parsed.length !== 1024) analysis.issues.push(`Wrong dimension: ${parsed.length}`);
            if (!analysis.hasValidValues) analysis.issues.push('All values are zero');
          } else {
            analysis.issues.push('Not an array after parsing');
          }
        } catch (e) {
          analysis.issues.push('JSON parse error');
        }
      } else if (Array.isArray(embedding)) {
        analysis.length = embedding.length;
        analysis.firstFewValues = embedding.slice(0, 5);
        analysis.hasValidValues = embedding.some(val => val !== 0);
        if (embedding.length === 0) analysis.issues.push('Empty array');
        if (embedding.length !== 1024) analysis.issues.push(`Wrong dimension: ${embedding.length}`);
        if (!analysis.hasValidValues) analysis.issues.push('All values are zero');
      } else {
        analysis.issues.push('Unknown type');
      }

      return analysis;
    }) || [];

    // 3. Test similarity calculation
    let similarityTest = null;
    if (chunks && chunks.length > 0) {
      const firstChunk = chunks[0];
      if (firstChunk.embedding) {
        try {
          // Calculate cosine similarity manually
          const dbEmbedding = typeof firstChunk.embedding === 'string' 
            ? JSON.parse(firstChunk.embedding) 
            : firstChunk.embedding;
          
          if (Array.isArray(dbEmbedding) && dbEmbedding.length === 1024) {
            const dotProduct = testEmbedding.embedding.reduce((sum, val, i) => sum + val * dbEmbedding[i], 0);
            const magnitude1 = Math.sqrt(testEmbedding.embedding.reduce((sum, val) => sum + val * val, 0));
            const magnitude2 = Math.sqrt(dbEmbedding.reduce((sum, val) => sum + val * val, 0));
            const similarity = dotProduct / (magnitude1 * magnitude2);
            
            similarityTest = {
              dotProduct,
              magnitude1,
              magnitude2,
              similarity,
              isValid: !isNaN(similarity) && isFinite(similarity)
            };
          }
        } catch (e) {
          similarityTest = { error: e instanceof Error ? e.message : String(e) };
        }
      }
    }

    return NextResponse.json({
      success: true,
      testEmbedding: {
        dimension: testEmbedding.dimension,
        length: testEmbedding.embedding.length,
        firstFewValues: testEmbedding.embedding.slice(0, 5),
        hasValidValues: testEmbedding.embedding.some(val => val !== 0)
      },
      databaseEmbeddings: embeddingAnalysis,
      similarityTest,
      recommendations: [
        ...(embeddingAnalysis.some(e => e.issues.length > 0) ? ['Fix problematic embeddings in database'] : []),
        ...(embeddingAnalysis.some(e => !e.hasValidValues) ? ['Regenerate embeddings with zero values'] : []),
        ...(embeddingAnalysis.some(e => e.length !== 1024) ? ['Fix dimension mismatches'] : []),
        ...(similarityTest && !similarityTest.isValid ? ['Fix similarity calculation issues'] : [])
      ]
    });

  } catch (error) {
    console.error('RAG diagnosis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'RAG diagnosis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
