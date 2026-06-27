'use client';

import styles from './toast.module.css';

import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface Props {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function Toast({
  visible,
  message,
  type,
}: Props) {
  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>

      <div className={styles.icon}>

        {type === 'success' ? (
          <CheckCircleIcon />
        ) : (
          <XCircleIcon />
        )}

      </div>

      <span className={styles.message}>
        {message}
      </span>

    </div>
  );
}