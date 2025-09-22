import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from '@/lib/services/EmbeddingService';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const embeddingService = new EmbeddingService();
    await embeddingService.initialize('bge-m3');

    // Test query
    const testQuery = "페이스북 광고 정책에 대해 알려주세요";
    console.log(`🔍 Testing RAG search with: "${testQuery}"`);

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(testQuery);
    console.log(`✅ Query embedding generated: ${queryEmbedding.dimension} dimensions`);

    // Search for similar chunks
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_documents', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.3,
        match_count: 5
      });

    if (searchError) {
      console.error('❌ Search error:', searchError);
      return NextResponse.json({
        success: false,
        error: 'Search failed',
        details: searchError.message
      }, { status: 500 });
    }

    console.log(`📊 Search results: ${searchResults?.length || 0} chunks found`);

    // Analyze results
    const analysis = {
      totalResults: searchResults?.length || 0,
      results: searchResults?.map(result => ({
        chunk_id: result.chunk_id,
        similarity: result.similarity,
        content_preview: result.content.substring(0, 100) + '...',
        hasValidSimilarity: result.similarity > 0
      })) || [],
      hasValidResults: searchResults?.some(r => r.similarity > 0) || false,
      maxSimilarity: searchResults?.length ? Math.max(...searchResults.map(r => r.similarity)) : 0,
      minSimilarity: searchResults?.length ? Math.min(...searchResults.map(r => r.similarity)) : 0
    };

    console.log(`📈 Similarity range: ${analysis.minSimilarity} - ${analysis.maxSimilarity}`);
    console.log(`✅ Valid results: ${analysis.hasValidResults}`);

    return NextResponse.json({
      success: true,
      query: testQuery,
      queryEmbedding: {
        dimension: queryEmbedding.dimension,
        length: queryEmbedding.embedding.length
      },
      analysis,
      searchResults: searchResults || []
    });

  } catch (error) {
    console.error('🚨 RAG search test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'RAG search test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
