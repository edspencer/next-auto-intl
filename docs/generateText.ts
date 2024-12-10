import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

async function retryGenerateText(params: Parameters<typeof generateText>[0], maxRetries = 3): Promise<ReturnType<typeof generateText>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting generateText call (attempt ${attempt}/${maxRetries})...`);
      return await generateText(params);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Final attempt failed:', error);
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // exponential backoff, max 10s
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should never reach here due to throw in loop');
}

async function getDoc(url: string) {
  try {
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

    //generate text with retries
    const { text } = await retryGenerateText({
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
    console.log('Documentation generation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Documentation generation failed:', error);
    process.exit(1);
  });
