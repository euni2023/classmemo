import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isAdminServer } from '@/lib/auth';

/**
 * POST /api/memos/[id]/analyze
 * admin만 호출 가능. 메모 ID에 대해 OpenAI API로 AI 분석을 수행합니다.
 * 환경 변수: OPENAI_API_KEY
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await isAdminServer();
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: memo, error } = await supabase
      .from('memos')
      .select('id, activity_content, reflection, created_at')
      .eq('id', id)
      .single();

    if (error || !memo) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다.' }, { status: 404 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const prompt = `
다음은 학생의 학습 메모입니다.

[배운 내용]
${memo.activity_content || ''}

[궁금한 점]
${memo.reflection || '없음'}

위 내용을 기반으로:
1) 배운 내용을 3~5문장으로 요약해 주고,
2) 학생의 이해도를 간단히 평가하고,
3) 추가로 학습하면 좋은 개념 2~3개를 제안해 주세요.

한국어로 답변해 주세요.
    `.trim();

    const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 교사 보조용 AI 튜터입니다. 학생 메모를 분석하고 학습 피드백을 제공합니다.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('OpenAI API error', llmRes.status, errText);
      return NextResponse.json(
        { error: 'AI 분석 호출에 실패했습니다.' },
        { status: 500 }
      );
    }

    const llmJson = await llmRes.json();
    const analysis =
      llmJson.choices?.[0]?.message?.content?.trim() ||
      'AI 분석 결과를 가져오지 못했습니다.';

    const analyzedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('memos')
      .update({ ai_analysis: analysis, ai_analyzed_at: analyzedAt })
      .eq('id', memo.id);

    if (updateError) {
      console.error('memo analysis save error', updateError);
      // 저장 실패해도 분석 결과는 반환
    }

    return NextResponse.json({
      memoId: memo.id,
      analysis,
      analyzed_at: analyzedAt,
    });
  } catch (e) {
    console.error('memo analyze error', e);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
