import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function usePersistedState<T>(
  read: () => T,
  write: (value: T) => void,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      return read();
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    write(value);
  }, [value, write]);

  return [value, setValue];
}
