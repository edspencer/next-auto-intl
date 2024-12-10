import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

async function getDoc(url: string) {
  //fetch the web document
  const content = await fetch(url).then((res) => res.text());

  // Use JSDOM to parse the HTML content
  const dom = new JSDOM(content);
  const document = dom.window.document;

  // Remove script tags and other non-useful content
  document
    .querySelectorAll('script, style, link[rel="stylesheet"]')
    .forEach((el) => el.remove());

  // Get the cleaned HTML content
  const cleanedContent = document.documentElement.outerHTML;

  //generate text
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `
    This is the HTML source for the documentation found at ${url}. 
    Please rewrite it as a markdown file, keeping as much of the original content as possible.
    
    ${cleanedContent}
    `,
  });

  // file name for the url
  const fileName = url.split('/').pop();
  const safeFileName =
    fileName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';

  // save the generated text to a markdown file
  fs.writeFileSync(path.join(__dirname, safeFileName), text);
}

async function main() {
  await getDoc(
    'https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text#generatetext'
  );
}

main()
  .then(() => {
    console.log('done');

    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
