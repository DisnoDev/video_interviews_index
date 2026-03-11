import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { VideoCollection } from './VideoCollection';
import { makeSampleRecords } from '../test/fixtures';

vi.mock('./VideoPlayer', () => ({
  VideoPlayer: ({ record }: { record: { slug: string } }) => <div data-testid="player">player:{record.slug}</div>,
}));

describe('VideoCollection', () => {
  it('uses slug routes to select the current record', () => {
    const records = makeSampleRecords();

    render(
      <MemoryRouter initialEntries={[`/${records[0].slug}`]}>
        <Routes>
          <Route path="/" element={<Harness records={records} />} />
          <Route path="/:slug" element={<Harness records={records} />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('player')).toHaveTextContent(`player:${records[0].slug}`);
  });

  it('navigates to the clicked record', async () => {
    const records = makeSampleRecords();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Harness records={records} />} />
          <Route path="/:slug" element={<Harness records={records} />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getAllByText('Repair')[0]);

    expect(screen.getByTestId('player')).toHaveTextContent(`player:${records[1].slug}`);
  });
});

function Harness({ records }: { records: ReturnType<typeof makeSampleRecords> }) {
  return (
    <VideoCollection
      records={records}
      loading={false}
      error={null}
      retry={async () => undefined}
      isDarkMode={false}
      setIsDarkMode={() => undefined}
      preferredLanguage="en"
      setPreferredLanguage={() => undefined}
      audioMode={false}
      setAudioMode={() => undefined}
      layoutMode="side"
      setLayoutMode={() => undefined}
    />
  );
}
