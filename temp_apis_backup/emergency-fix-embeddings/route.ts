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

    console.log('🚨 Emergency embedding fix started...');

    // 1. Get all chunks that need fixing
    const { data: chunks, error: fetchError } = await supabase
      .from('document_chunks')
      .select('id, chunk_id, content, embedding, metadata')
      .or('embedding.is.null,embedding.eq.[],embedding.like.%[]%');

    if (fetchError) {
      throw new Error(`Failed to fetch chunks: ${fetchError.message}`);
    }

    console.log(`📊 Found ${chunks?.length || 0} chunks to fix`);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No chunks need fixing',
        fixedCount: 0,
        errorCount: 0
      });
    }

    let fixedCount = 0;
    let errorCount = 0;
    const errors: Array<{ chunkId: string; error: string }> = [];

    // 2. Process each chunk
    for (const chunk of chunks) {
      try {
        console.log(`🔧 Fixing chunk: ${chunk.chunk_id}`);
        
        // Generate new embedding
        const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
        
        // Update the chunk
        const { error: updateError } = await supabase
          .from('document_chunks')
          .update({
            embedding: embeddingResult.embedding,
            metadata: {
              ...chunk.metadata,
              model: embeddingResult.model,
              dimension: embeddingResult.dimension,
              processingTime: embeddingResult.processingTime,
              emergencyFixed: true,
              fixedAt: new Date().toISOString()
            }
          })
          .eq('id', chunk.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        fixedCount++;
        console.log(`✅ Fixed chunk: ${chunk.chunk_id}`);

      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ chunkId: chunk.chunk_id, error: errorMsg });
        console.error(`❌ Failed to fix chunk ${chunk.chunk_id}:`, errorMsg);
      }
    }

    // 3. Also fix any chunks with zero-value embeddings
    console.log('🔍 Checking for zero-value embeddings...');
    
    const { data: allChunks, error: allChunksError } = await supabase
      .from('document_chunks')
      .select('id, chunk_id, content, embedding, metadata');

    if (!allChunksError && allChunks) {
      for (const chunk of allChunks) {
        try {
          let needsRegeneration = false;
          
          if (chunk.embedding) {
            const embedding = typeof chunk.embedding === 'string' 
              ? JSON.parse(chunk.embedding) 
              : chunk.embedding;
            
            if (Array.isArray(embedding)) {
              // Check if all values are zero or very close to zero
              const hasNonZeroValues = embedding.some(val => Math.abs(val) > 1e-10);
              if (!hasNonZeroValues) {
                needsRegeneration = true;
                console.log(`🔄 Regenerating zero-value embedding: ${chunk.chunk_id}`);
              }
            }
          }

          if (needsRegeneration) {
            const embeddingResult = await embeddingService.generateEmbedding(chunk.content);
            
            const { error: updateError } = await supabase
              .from('document_chunks')
              .update({
                embedding: embeddingResult.embedding,
                metadata: {
                  ...chunk.metadata,
                  model: embeddingResult.model,
                  dimension: embeddingResult.dimension,
                  processingTime: embeddingResult.processingTime,
                  zeroValueFixed: true,
                  fixedAt: new Date().toISOString()
                }
              })
              .eq('id', chunk.id);

            if (updateError) {
              throw new Error(`Update failed: ${updateError.message}`);
            }

            fixedCount++;
            console.log(`✅ Fixed zero-value embedding: ${chunk.chunk_id}`);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ chunkId: chunk.chunk_id, error: errorMsg });
          console.error(`❌ Failed to fix zero-value embedding ${chunk.chunk_id}:`, errorMsg);
        }
      }
    }

    console.log(`🎉 Emergency fix completed: ${fixedCount} fixed, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Emergency embedding fix completed`,
      fixedCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit error details
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('🚨 Emergency embedding fix failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Emergency embedding fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
