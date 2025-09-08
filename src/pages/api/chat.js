// Pages Router 방식의 API 라우트
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청 처리
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: 'Pages Router API가 정상적으로 작동합니다.',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST', 'OPTIONS']
    });
    return;
  }

  // POST 요청 처리
  if (req.method === 'POST') {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '메시지가 필요합니다.',
          details: '유효한 메시지를 입력해주세요.'
        });
        return;
      }

      console.log(`💬 Pages Router API 요청: "${message}"`);

      // 간단한 응답
      const response = {
        success: true,
        response: {
          message: `안녕하세요! "${message}"라는 메시지를 받았습니다. Pages Router API가 정상적으로 작동하고 있습니다.`,
          sources: [],
          confidence: 100,
          processingTime: 50,
          model: 'pages-router',
          isLLMGenerated: false
        }
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Pages Router API 오류:', error);
      res.status(500).json({
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: error.message
      });
    }
    return;
  }

  // 지원하지 않는 메서드
  res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
    details: `${req.method} 메서드는 지원하지 않습니다.`
  });
}
