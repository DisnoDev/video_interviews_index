import { useEffect } from 'react';
import { VideoCollection } from './VideoCollection';
import { useInterviewData } from '../hooks/useInterviewData';
import { usePersistedState } from '../hooks/usePersistedState';
import {
  getAudioClicked,
  getAudioMode,
  getLayoutMode,
  getPreferredLanguage,
  getTheme,
  setAudioClicked,
  setAudioMode,
  setLayoutMode,
  setPreferredLanguage,
  setTheme,
} from '../lib/prefs';

export function VideoCollectionWrapper() {
  const { records, loading, error, retry } = useInterviewData();
  const [isDarkMode, setIsDarkMode] = usePersistedState(() => getTheme() !== 'light', (value) => setTheme(value ? 'dark' : 'light'), false);
  const [preferredLanguage, setPreferredLanguageState] = usePersistedState(getPreferredLanguage, setPreferredLanguage, '');
  const [layoutMode, setLayoutModeState] = usePersistedState(() => getLayoutMode() || 'side', setLayoutMode, 'side');
  const [audioMode, setAudioModeState] = usePersistedState(() => {
    const stored = getAudioMode();
    return getAudioClicked() ? stored : false;
  }, setAudioMode, false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const handleAudioModeChange = (value: boolean) => {
    setAudioClicked();
    setAudioModeState(value);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
        <VideoCollection
          records={records}
          loading={loading}
          error={error}
          retry={retry}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          preferredLanguage={preferredLanguage}
          setPreferredLanguage={setPreferredLanguageState}
          audioMode={audioMode}
          setAudioMode={handleAudioModeChange}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutModeState}
        />
      </div>
    </div>
  );
}
