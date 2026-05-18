import { useCallback, useEffect, useRef, useState } from 'react';

export const DEFAULT_MESSAGE = { type: '', text: '' };

export const useTimedMessage = ({ timeoutMs = 4500 } = {}) => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const timeoutRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearMessage = useCallback(() => {
    clearTimer();
    setMessage(DEFAULT_MESSAGE);
  }, [clearTimer]);

  const showMessage = useCallback(
    (type, text) => {
      clearTimer();
      setMessage({ type, text });
      timeoutRef.current = setTimeout(() => {
        setMessage(DEFAULT_MESSAGE);
        timeoutRef.current = null;
      }, timeoutMs);
    },
    [clearTimer, timeoutMs]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    message,
    showMessage,
    clearMessage,
  };
};

export default useTimedMessage;

