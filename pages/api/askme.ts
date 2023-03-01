import { Client } from '@neondatabase/serverless';
import cors from '../../lib/cors';
import { createStream, CompletionParams } from '../../lib/createStream';
import { Request } from 'next/dist/compiled/@edge-runtime/primitives/fetch';

const max_tokens = 1700;

export const config = {
  runtime: 'experimental-edge',
  regions: ['fra1'],
};

export default async (req: Request, res) => {
  console.log(req);
  console.log(res);

  if (req.method === 'OPTIONS') {
    return cors(req, new Response(null, { status: 200, headers: {} }));
  }
  const { query } = (await req.json()) as {
    query?: string;
  };

  if (!query) {
    return cors(req, new Response('No prompt in the request', { status: 400 }));
  }
  console.log('Query', query);

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
    // Create context from embeddings
    const context = await createContext(query);
    prompt = `You are an enthusiastic Postgres developer who loves Neon database and has a passion for helping answering developers might have. Answer the question asked by developers based on the context below. If the question can't be answered based on the context, say "Sorry :( I don't know."\n\nContext: ${context}\n\n---\n\nQuestion: ${query}\nAnswer:`;

    // generate an id for the question
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

// create a context for the question
async function createContext(input: string) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: input,
    }),
  });

  const responseJson = await response.json();
  const q_embeddings = responseJson['data'][0]['embedding'];
  const q_embeddings_str = q_embeddings.toString().replace(/\.\.\./g, '');

  // Query the database for the context
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const query = `
  SELECT text
  FROM (
    SELECT text, n_tokens, embeddings,
    (embeddings <=> '[${q_embeddings_str}]') AS distances,
    SUM(n_tokens) OVER (ORDER BY (embeddings <=> '[${q_embeddings_str}]')) AS cum_n_tokens
    FROM documents
    ) subquery
  WHERE cum_n_tokens <= $1
  ORDER BY distances ASC;
  `;

  const queryParams = [max_tokens];
  console.log('Querying database...');
  const { rows } = await client.query(query, queryParams);
  await client.end();
  const context = rows.reduce((acc, cur) => {
    return acc + cur.text;
  }, '');
  return context;
}

// async function getCommandPrompt({
//   query,
//   context,
//   neon_api_key,
//   completionParams,
// }: {
//   query: string;
//   context: string;
//   neon_api_key: string;
//   completionParams: CompletionParams;
// }) {
//   const example_input =
//     "curl 'https://console.neon.tech/api/v2/projects'  -H 'Content-Type: application/json'  -H 'Authorization: Bearer 7dvt479eou2u5f5eng8wfwo5hozigoa1fn4m4nldp1hlp11ciiaj8jrlbhd0722s' -X POST -d '{\"project\":{\"name\":\"halo\"}}'";

//   const prompt = `You loves generating curl commands related to Neon API v2 that create and delete projects, branches, database and everything Neon API related. Generate the Neon API command as following the documentation's strict parameters related to the command on the context and question below and return only the Neon API v2 command such as this curl command for creating a project: '${example_input}'. Here are the parameters you can use in your answer: project_id, parent_id, name. Remove a parameter from answer if it's not provided in the question.If the question can't be answered based on the context, say "NULL."\n\nContext: ${context}\n\n---\n\nQuestion: ${query}. API_KEY=${neon_api_key}\nAnswer:`;

//   const commandRes = await fetch('https://api.openai.com/v1/completions', {
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
//     },
//     method: 'POST',
//     body: JSON.stringify({
//       ...completionParams,
//       prompt: prompt,
//       stream: false,
//     }),
//   });

//   const commandResJson = await commandRes.json();
//   const curlCommand = commandResJson['choices'][0]['text'].trim();
//   const cmdAnswerJson = parseCurlCommand(curlCommand);

//   const { url, method, body, headers } = cmdAnswerJson;

//   const answer = await fetch(url, {
//     headers: headers,
//     method,
//     body,
//   });

//   return answer.ok
//     ? `Based on the context, your previous answer, the successful boolean and the payload, write a message to let the developer know if their command was successfully executed. Example: The branch with id branch-id-2457 was created"\n\nContext: ${context}\n\n---\n\nPrevious answer: ${curlCommand}\n\n---\n\nPayload: ${JSON.stringify(
//         cmdAnswerJson
//       )}\nAnswer:`
//     : `Write a status message to developers to tell them the command was not successfully executed`;
// }

// async function getQueryIntent(query: string, context: string) {
//   const commandIntent = await fetch('https://api.openai.com/v1/completions', {
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
//     },
//     method: 'POST',
//     body: JSON.stringify({
//       model: 'text-davinci-003',
//       prompt: `Answer the question using the Sentence and Context. Is the folllowing sentence a Neon API v2 command or a question about Postgres or/and Neon? Answer strictly with the words 'Command' or 'Question' ${query}\n\n---\n\nSentence: ${query}"\n\nContext: ${context}\n\n---\n\nAnswer:`,
//       temperature: 0.5,
//       top_p: 1,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//       max_tokens: 1700,
//       stream: false,
//       n: 1,
//     }),
//   });

//   const commandIntentJson = await commandIntent.json();
//   return commandIntentJson['choices'][0]['text'].trim();
// }

// function parseCurlCommand(curlCommand: string) {
//   const result = {
//     method: 'GET',
//     headers: {},
//     body: '',
//     url: '',
//   };

//   const options = curlCommand.split(' ');
//   options.shift(); // Remove the curl command.

//   // Extract the URL from the curl command.
//   result['url'] = options.shift().slice(1, -1);

//   // Extract any other options passed to the curl command.
//   options.forEach((option, i) => {
//     if (option === '-X') {
//       result.method = options[i + 1];
//     }
//     if (option === '-H') {
//       const header = options[i + 1].split(':');
//       const value =
//         options[i + 2].trim() === 'Bearer'
//           ? `${options[i + 2]} ${options[i + 3]}`
//           : `${options[i + 2]}`;
//       result.headers[header[0].trim().substring(1)] = value.slice(0, -1);
//     }
//     if (option === '-d') {
//       result['body'] = options[i + 1].slice(1, -1);
//     }
//   });

//   return result;
// }
