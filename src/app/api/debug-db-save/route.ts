import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Check total count of documents and chunks
    const { count: docCount, error: docError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const { count: chunkCount, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });

    // 2. Try to insert a test chunk with vector data
    const testEmbedding = new Array(1024).fill(0).map(() => Math.random() - 0.5);
    
    const { data: testInsert, error: testError } = await supabase
      .from('document_chunks')
      .insert({
        document_id: 'test_doc',
        content: 'Test content for debugging',
        embedding: testEmbedding,
        metadata: { test: true }
      })
      .select();

    // 3. Check if the test insert worked
    let testResult = null;
    if (!testError) {
      const { data: testData, error: testFetchError } = await supabase
        .from('document_chunks')
        .select('id, embedding, embedding_vector')
        .eq('document_id', 'test_doc')
        .limit(1);
      
      testResult = {
        insertSuccess: true,
        fetchData: testData,
        fetchError: testFetchError
      };

      // Clean up test data
      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', 'test_doc');
    }

    return NextResponse.json({
      success: true,
      summary: {
        documentCount: docCount,
        chunkCount: chunkCount,
        documentError: docError,
        chunkError: chunkError
      },
      testInsert: {
        success: !testError,
        error: testError,
        data: testInsert
      },
      testResult: testResult,
      recommendation: testError ? 
        'Database insert is failing - check column types and permissions' :
        'Database insert works - check why real data is not being saved'
    });

  } catch (error: any) {
    console.error('Error in debug-db-save:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

