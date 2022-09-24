import { Client } from '@notionhq/client';
import { NotionToMarkdown } from "notion-to-md";

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

function parsePostTags(rawTags: Array<Object>): Array<string> {
  let result: Array<string> = [];
  rawTags.forEach((rawTag) => {
    result.push(
      JSON.parse(JSON.stringify(rawTag)).name
    );
  });
  return result;
}

async function fetchPostById(postId: string): Promise<PostData> {
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
    parsePostTags(postData.properties.Tags.multi_select),
    markdownString
  );
}

import type { Handler } from "@netlify/functions";

const handler: Handler = async (event, _) => {
  return {
    statusCode: 200,
    body: JSON.stringify(await fetchPostById(event.queryStringParameters!.id ?? "")),
  };
};

export { handler };