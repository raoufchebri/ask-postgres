import cors from '../../lib/cors';
import { createStream, CompletionParams } from '../../lib/createStream';

export const config = {
  runtime: 'experimental-edge',
  regions: ['fra1'],
};

export default async (req: Request) => {
  const { query } = (await req.json()) as {
    query?: string;
  };

  if (!query) {
    return new Response('No prompt in the request', { status: 400 });
  }

  let prompt = '';

  const completionParams: CompletionParams = {
    model: 'text-davinci-003',
    prompt,
    temperature: 0.5,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1700,
    stream: true,
    n: 1,
  };

  try {
    // Checking prompt intent
    prompt = `Write a message to recap the query. \n\n---\n\nQuery: ${query}\nAnswer:`;
  } catch (e) {
    prompt = `write an error message to explain why the query errored.--\n\Error: ${JSON.stringify(
      e
    )}\nAnswer:`;
  } finally {
    const stream = await createStream({ ...completionParams, prompt });
    // `cors` also takes care of handling OPTIONS requests
    return cors(
      req,
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
};
