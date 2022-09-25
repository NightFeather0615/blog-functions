import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const { NOTION_SECRET } = process.env;
const notionClient = new Client(
  { auth: NOTION_SECRET }
);
const notionToMarkdown = new NotionToMarkdown(
  { notionClient: notionClient }
);

class PostData {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public thumbnail: string,
    public createdAt: string,
    public lastEditedAt: string,
    public tags: Array<string>,
    public content: string
  ) {}
}

async function fetchPostById(postId: string): Promise<Object | PostData> {
  try {
    let rawPostData = await notionClient.pages.retrieve({ page_id: postId });
    let postData = JSON.parse(JSON.stringify(rawPostData));
    let rawMarkdown = await notionToMarkdown.pageToMarkdown(postId);
    let markdownString = notionToMarkdown.toMarkdownString(rawMarkdown).replace(/^  \<\/details\>$/mg, "</details>").replace(/^  $/mg, "<br/>");
    return new PostData(
      postId,
      postData.properties.Title.title[0].plain_text,
      postData.properties.Description.rich_text[0].plain_text,
      postData.properties.Thumbnail.files[0].external.url,
      postData.created_time,
      postData.last_edited_time,
      postData.properties.Tags.multi_select.map((rawTag: { name: any; }) => {
        return rawTag.name;
      }),
      markdownString
    );
  } catch {
    return {
      status: 400,
      code: "validation_error"
    };
  }
}

import type { Handler } from "@netlify/functions";

const handler: Handler = async (event, _) => {
  if (event.queryStringParameters == null || event.queryStringParameters.id == undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: 400,
        code: "missing_parameters",
        missing_parameters: ["id"]
      }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(await fetchPostById(event.queryStringParameters.id))
  };
};

export { handler };