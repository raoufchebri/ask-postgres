import '../styles/globals.css';
import 'styles/cmdk/vercel.scss';

import { ThemeProvider } from 'next-themes';
import { NextSeo } from 'next-seo';
import Head from 'next/head';

const title = 'pg-guru';
const description = 'Ask me about Neon and Postgres.';
const siteUrl = 'https://postgres.org';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel='shortcut icon' href='/favicon.svg' />
        <meta name='twitter:card' content='summary_large_image' />
      </Head>
      <NextSeo
        title={`${description} — ${title}`}
        description={description}
        openGraph={{
          type: 'website',
          url: siteUrl,
          title,
          description: description + '.',
          images: [
            {
              url: `${siteUrl}/og.png`,
              alt: title,
            },
          ],
        }}
      />
      <ThemeProvider disableTransitionOnChange attribute='class'>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default MyApp;
