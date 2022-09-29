import { Client } from '@notionhq/client';
import type { Handler } from '@netlify/functions';

const { NOTION_SECRET, DATABASE_ID } = process.env;
const notionClient = new Client(
  { auth: NOTION_SECRET }
);

class PostInfo {
  constructor(
    public id: string, 
    public title: string,
    public description: string,
    public thumbnail: string,
    public createdAt: string,
    public lastEditedAt: string,
    public tags: Array<string>
  ) {}
}

async function fetchPosts(): Promise<Array<PostInfo>> {
  let data = await notionClient.databases.query(
    {
      database_id: DATABASE_ID as string
    }
  );
  let result: Array<PostInfo> = [];
  data.results.forEach(async (postData: any) => {
    if (!postData.properties.Public.checkbox) {
      return;
    }
    result.push(
      new PostInfo(
        postData.id,
        postData.properties.Title.title[0].plain_text,
        postData.properties.Description.rich_text[0].plain_text,
        postData.properties.Thumbnail.files[0].external.url,
        postData.created_time,
        postData.last_edited_time,
        postData.properties.Tags.multi_select.map((rawTag: { name: any; }) => {
          return rawTag.name;
        }),
      )
    );
  });
  return result;
}

const handler: Handler = async (_, __) => {
  return {
    statusCode: 200,
    body: JSON.stringify(await fetchPosts()),
  };
};

export { handler };