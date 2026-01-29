export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { title, completed } = req.body;
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  try {
    // 1. 먼저 노션 DB에서 해당 제목을 가진 페이지가 있는지 찾습니다.
    const searchRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: { property: '이름', title: { equals: title } }
      })
    });

    const searchData = await searchRes.json();

    if (searchData.results.length > 0) {
      // 2. 이미 있다면? 완료 상태만 업데이트합니다. (PATCH)
      const pageId = searchData.results[0].id;
      const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          properties: { '완료': { checkbox: completed } }
        })
      });
      return res.status(200).json({ status: 'updated' });
    } else {
      // 3. 없다면? 새로 만듭니다. (POST)
      const createRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            '이름': { title: [{ text: { content: title } }] },
            '완료': { checkbox: completed }
          }
        })
      });
      return res.status(200).json({ status: 'created' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
