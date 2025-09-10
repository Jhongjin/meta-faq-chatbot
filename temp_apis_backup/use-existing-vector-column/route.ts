import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Check if embedding_vector column exists and has data
    const { data: vectorData, error: vectorError } = await supabase
      .from('document_chunks')
      .select('id, embedding_vector')
      .not('embedding_vector', 'is', null)
      .limit(5);

    if (vectorError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot access embedding_vector column',
        details: vectorError 
      }, { status: 500 });
    }

    // 2. Check if embedding column exists and has data
    const { data: textData, error: textError } = await supabase
      .from('document_chunks')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(5);

    if (textError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot access embedding column',
        details: textError 
      }, { status: 500 });
    }

    // 3. If embedding_vector has data, use it; otherwise, convert from embedding
    if (vectorData && vectorData.length > 0) {
      // Use existing vector data
      return NextResponse.json({
        success: true,
        message: 'embedding_vector column already has data',
        vectorCount: vectorData.length,
        sampleVectorData: vectorData[0],
        recommendation: 'Use embedding_vector column directly'
      });
    } else if (textData && textData.length > 0) {
      // Convert text embeddings to vector
      let convertedCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const chunk of textData.slice(0, 10)) { // Process first 10 for testing
        try {
          if (typeof chunk.embedding === 'string') {
            const parsedEmbedding = JSON.parse(chunk.embedding);
            
            if (Array.isArray(parsedEmbedding) && parsedEmbedding.every(item => typeof item === 'number')) {
              const { error: updateError } = await supabase
                .from('document_chunks')
                .update({ embedding_vector: parsedEmbedding })
                .eq('id', chunk.id);

              if (updateError) {
                errors.push({ chunkId: chunk.id, error: updateError.message });
                errorCount++;
              } else {
                convertedCount++;
              }
            }
          }
        } catch (parseError: any) {
          errors.push({ chunkId: chunk.id, error: parseError.message });
          errorCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Converted text embeddings to vector format',
        convertedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        recommendation: 'Continue converting remaining chunks'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No embedding data found in either column',
        vectorData: vectorData,
        textData: textData
      });
    }

  } catch (error: any) {
    console.error('Error in use-existing-vector-column:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

