import React, { useState } from 'react';
import { Command } from 'cmdk';
import { LoadingDots } from '../index';
import { motion } from 'framer-motion';

export const CMDK = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [feedback, setFeedback] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [answer, setAnswer] = useState<String>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const answerQuestion = async (e: any) => {
    e.preventDefault();
    setAnswer('');
    setLoading(true);
    const askmeUrl = '/api/askpg';
    // const summaryUrl = '/api/summary';
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
      }),
    };

    // fetch(summaryUrl, params).then(async (response) => {
    //   console.log('Edge function returned.');

    //   if (!response.ok) {
    //     throw new Error(response.statusText);
    //   }

    //   // This data is a ReadableStream
    //   const data = response.body;
    //   if (!data) {
    //     return;
    //   }

    //   const reader = data.getReader();
    //   const decoder = new TextDecoder();
    //   let done = false;

    //   while (!done) {
    //     const { value, done: doneReading } = await reader.read();
    //     done = doneReading;
    //     const chunkValue = decoder.decode(value);
    //     setAnswer((prev) => prev + chunkValue);
    //   }
    // });

    fetch(askmeUrl, params).then(async (response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      // This data is a ReadableStream
      const data = response.body;
      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setAnswer((prev) => prev + chunkValue);
      }
      setLoading(false);
    });
  };

  async function submitFeedback() {
    console.log({
      query,
      answer,
      suggestedAnswer,
      feedback,
    });
    setFeedbackLoading(true);
    const response = await fetch('/api/fine-tune-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        answer,
        suggestedAnswer,
        feedback,
      }),
    });

    const data = await response.json();
    console.log(data);
    setFeedbackSubmitted(true);
    setFeedbackLoading(false);
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    setFeedbackLoading(false);
    if (query.length && e.key === 'Enter') {
      bounce();
      answerQuestion(e);
    }
  };

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = '';
        }
      }, 100);

      // setQuery('');
    }
  }

  return (
    <div className='vercel'>
      <Command ref={ref} onKeyDown={onKeyDown}>
        <Command.Input
          autoFocus
          placeholder='Ask me about Postgres'
          onValueChange={(value) => {
            setQuery(value);
          }}
        />
        <Command.List
          style={{
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            justifyContent: 'start',
          }}
        >
          {loading && answer === '' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LoadingDots color='white' style='large' />
            </div>
          )}

          <p
            style={{
              fontSize: 14,
              height: '100%',
              lineHeight: '1.8',
              marginBottom: 48,
            }}
          >
            {answer}
          </p>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              margin: '16px', // add some margin for spacing
            }}
          >
            {answer && !loading && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <ThumbsUpIcon
                    filled={feedback}
                    onClick={() => setFeedback(feedback ? undefined : true)}
                  />
                  <ThumbsDownIcon
                    filled={feedback !== undefined && !feedback}
                    onClick={() =>
                      setFeedback(feedback === false ? undefined : false)
                    }
                  />
                </motion.div>
              </>
            )}
          </div>
        </Command.List>
        {feedback === false && !feedbackSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <textarea
                placeholder='Propose an answer?'
                style={{
                  width: '100%',
                  height: 100,
                  borderRadius: 4,
                  borderColor: '#343434',
                  padding: 8,
                  fontSize: 14,
                  outline: 'none',
                  backgroundColor: 'inherit',
                  color: '#a1a1a1',
                }}
                onChange={(e) => {
                  setSuggestedAnswer(e.target.value);
                }}
              />
              {/* add a submit button at the right bottom corner of the parent div */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 48,
                  right: 0,
                  margin: '16px', // add some margin for spacing
                }}
              >
                <button
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: '#a1a1a1',
                  }}
                  onClick={submitFeedback}
                >
                  {feedbackLoading ? (
                    <LoadingDots color='white' style='large' />
                  ) : (
                    'Submit feedback'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </Command>
    </div>
  );
};

const ThumbsUpIcon = ({ filled, onClick }) => {
  const color = 'gray';
  const size = 24;

  return (
    <a style={{ cursor: 'pointer' }} onClick={onClick}>
      <svg
        viewBox='0 0 24 24'
        fill={color}
        width={size}
        height={size}
        xmlns='http://www.w3.org/2000/svg'
      >
        {filled ? (
          <path
            d='M7.24001 11V20H5.63001C4.73001 20 4.01001 19.28 4.01001 18.39V12.62C4.01001 11.73 4.74001 11 5.63001 11H7.24001ZM18.5 9.5H13.72V6C13.72 4.9 12.82 4 11.73 4H11.64C11.24 4 10.88 4.24 10.72 4.61L7.99001 11V20H17.19C17.92 20 18.54 19.48 18.67 18.76L19.99 11.26C20.15 10.34 19.45 9.5 18.51 9.5H18.5Z'
            fill={color}
          />
        ) : (
          <path d='M20.22 9.55C19.79 9.04 19.17 8.75 18.5 8.75H14.47V6C14.47 4.48 13.24 3.25 11.64 3.25C10.94 3.25 10.31 3.67 10.03 4.32L7.49 10.25H5.62C4.31 10.25 3.25 11.31 3.25 12.62V18.39C3.25 19.69 4.32 20.75 5.62 20.75H17.18C18.27 20.75 19.2 19.97 19.39 18.89L20.71 11.39C20.82 10.73 20.64 10.06 20.21 9.55H20.22ZM5.62 19.25C5.14 19.25 4.75 18.86 4.75 18.39V12.62C4.75 12.14 5.14 11.75 5.62 11.75H7.23V19.25H5.62ZM17.92 18.63C17.86 18.99 17.55 19.25 17.18 19.25H8.74V11.15L11.41 4.9C11.45 4.81 11.54 4.74 11.73 4.74C12.42 4.74 12.97 5.3 12.97 5.99V10.24H18.5C18.73 10.24 18.93 10.33 19.07 10.5C19.21 10.67 19.27 10.89 19.23 11.12L17.91 18.62L17.92 18.63Z' />
        )}
      </svg>
    </a>
  );
};

const ThumbsDownIcon = ({ filled, onClick }) => {
  const color = 'gray';
  const size = 24;

  return (
    <a style={{ cursor: 'pointer' }} onClick={onClick}>
      <svg
        viewBox='0 0 24 24'
        fill={color}
        width={size}
        height={size}
        xmlns='http://www.w3.org/2000/svg'
        style={{ transform: 'rotate(180deg)' }}
      >
        {filled ? (
          <path
            d='M7.24001 11V20H5.63001C4.73001 20 4.01001 19.28 4.01001 18.39V12.62C4.01001 11.73 4.74001 11 5.63001 11H7.24001ZM18.5 9.5H13.72V6C13.72 4.9 12.82 4 11.73 4H11.64C11.24 4 10.88 4.24 10.72 4.61L7.99001 11V20H17.19C17.92 20 18.54 19.48 18.67 18.76L19.99 11.26C20.15 10.34 19.45 9.5 18.51 9.5H18.5Z'
            fill={color}
          />
        ) : (
          <path d='M20.22 9.55C19.79 9.04 19.17 8.75 18.5 8.75H14.47V6C14.47 4.48 13.24 3.25 11.64 3.25C10.94 3.25 10.31 3.67 10.03 4.32L7.49 10.25H5.62C4.31 10.25 3.25 11.31 3.25 12.62V18.39C3.25 19.69 4.32 20.75 5.62 20.75H17.18C18.27 20.75 19.2 19.97 19.39 18.89L20.71 11.39C20.82 10.73 20.64 10.06 20.21 9.55H20.22ZM5.62 19.25C5.14 19.25 4.75 18.86 4.75 18.39V12.62C4.75 12.14 5.14 11.75 5.62 11.75H7.23V19.25H5.62ZM17.92 18.63C17.86 18.99 17.55 19.25 17.18 19.25H8.74V11.15L11.41 4.9C11.45 4.81 11.54 4.74 11.73 4.74C12.42 4.74 12.97 5.3 12.97 5.99V10.24H18.5C18.73 10.24 18.93 10.33 19.07 10.5C19.21 10.67 19.27 10.89 19.23 11.12L17.91 18.62L17.92 18.63Z' />
        )}
      </svg>
    </a>
  );
};
