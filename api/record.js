export default async function handler(req, res) {
  // POST 요청이 아니면 차단합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 위젯(index.html)에서 보낸 데이터를 받습니다.
  const { title, completed, databaseId, notionToken } = req.body;

  try {
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
          // 노션 DB의 '이름' 열에 할 일을 넣습니다.
          '이름': { 
            title: [{ text: { content: title } }] 
          },
          // 노션 DB의 '완료' 열(체크박스)에 상태를 넣습니다.
          '완료': { 
            checkbox: completed 
          }
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 성공적으로 저장됨
      return res.status(200).json(data);
    } else {
      // 노션 API 에러 발생 시
      return res.status(response.status).json(data);
    }
  } catch (error) {
    // 네트워크 등 서버 에러 발생 시
    return res.status(500).json({ error: error.message });
  }
}
