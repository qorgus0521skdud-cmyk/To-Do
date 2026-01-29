export default async function handler(req, res) {
  // 1. POST 요청이 아니면 거절합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, completed } = req.body;

  // 2. Vercel Settings -> Environment Variables에 등록한 값을 가져옵니다.
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  // 3. 만약 환경 변수가 제대로 설정되지 않았다면 에러를 보냅니다.
  if (!notionToken || !databaseId) {
    return res.status(500).json({ 
      error: "환경 변수가 설정되지 않았습니다. Vercel 설정을 확인해주세요." 
    });
  }

  try {
    // 4. 노션 API 호출
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          '이름': { 
            title: [{ text: { content: title } }] 
          },
          '완료': { 
            checkbox: completed || false 
          }
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 저장 성공!
      return res.status(200).json(data);
    } else {
      // 노션에서 에러를 보냈을 때 (토큰 무효, 권한 부족 등)
      console.error("Notion API Error:", data);
      return res.status(response.status).json(data);
    }
  } catch (error) {
    // 네트워크 에러 등 예외 발생
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
