import { Client } from '@notionhq/client';
import type { Handler } from '@netlify/functions';

const { NOTION_SECRET, DATABASE_ID } = process.env;
const notionClient = new Client(
  { auth: NOTION_SECRET }
);

async function fetchTags(): Promise<Array<Object>> {
  let databaseData = await notionClient.databases.retrieve(
    {
      database_id: DATABASE_ID as string
    }
  );
  return databaseData.properties.Tags.multi_select.options;
}

const handler: Handler = async (_, __) => {
  return {
    statusCode: 200,
    body: JSON.stringify(await fetchTags()),
  };
};

export { handler };