import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from 'styles/index.module.scss';
import { CMDK } from '../components';
import * as Popover from '@radix-ui/react-popover';

export default function Home() {
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef(null);

  useEffect(() => {
    function listener(e: KeyboardEvent) {
      if (e.key === 'k' && e.metaKey) {
        e.preventDefault();
        // setOpen((o) => !o);
      }
    }

    document.addEventListener('keydown', listener);

    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;

    if (!el) return;

    if (open) {
      el.style.overflow = 'hidden';
    } else {
      el.style.overflow = '';
    }
  }, [open, listRef]);

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <div className={styles.info}>
            <h1>Ask Neon</h1>
            <p>
              Answers questions about Postgres and Neon. Powered by OpenAI,
              Vercel and Neon.
            </p>
          </div>
        </div>
        {/* <Popover.Root open={open} onOpenChange={setOpen} modal> */}
        <Popover.Root open={true}>
          <Popover.Trigger
            cmdk-raycast-subcommand-trigger=''
            onClick={() => setOpen(true)}
            aria-expanded={open}
          ></Popover.Trigger>
          <Popover.Content
            align='start'
            className='raycast-submenu'
            sideOffset={16}
            alignOffset={0}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              inputRef?.current?.focus();
            }}
          >
            <AnimatePresence mode='sync' initial={true}>
              <CMDKWrapper key='vercel'>
                <CMDK />
              </CMDKWrapper>
            </AnimatePresence>
          </Popover.Content>
        </Popover.Root>
      </div>
    </main>
  );
}

const CMDKWrapper = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        marginBottom: 50,
      }}
      {...props}
    />
  );
};
