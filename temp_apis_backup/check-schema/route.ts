import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check the actual column types in the database
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_column_info', { table_name: 'document_chunks' });

    if (columnError) {
      // Fallback: try to get schema info another way
      const { data: sampleData, error: sampleError } = await supabase
        .from('document_chunks')
        .select('id, embedding')
        .limit(1);

      if (sampleError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot access document_chunks table',
          details: sampleError 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Schema check completed',
        sampleData: sampleData,
        note: 'Could not get column info via RPC, but table is accessible'
      });
    }

    return NextResponse.json({
      success: true,
      columnInfo: columnInfo,
      message: 'Schema check completed successfully'
    });
  } catch (error: any) {
    console.error('Unhandled error in check-schema API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}