import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { VideoCollection } from './VideoCollection';
import { makeSampleRecords } from '../test/fixtures';

vi.mock('./VideoPlayer', () => ({
  VideoPlayer: ({
    record,
    onAuthorClick,
    onTitleClick,
    onCategoryClick,
  }: {
    record: { slug: string; author: string; collection: string; title: string };
    onAuthorClick?: (value: string) => void;
    onTitleClick?: (value: string) => void;
    onCategoryClick?: (value: string) => void;
  }) => (
    <div data-testid="player">
      <div>{`player:${record.slug}`}</div>
      <button type="button" onClick={() => onAuthorClick?.(record.author)}>filter-author</button>
      <button type="button" onClick={() => onTitleClick?.(record.title)}>filter-title</button>
      <button type="button" onClick={() => onCategoryClick?.(record.collection)}>filter-category</button>
    </div>
  ),
}));

describe('VideoCollection', () => {
  it('uses slug routes to select the current record', () => {
    const records = makeSampleRecords();

    render(
      <MemoryRouter initialEntries={[`/${records[0].slug}`]}>
        <Routes>
          <Route path="/:slug?" element={<Harness records={records} />} />
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
          <Route path="/:slug?" element={<Harness records={records} />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getAllByText('Repair')[0]);

    expect(screen.getByTestId('player')).toHaveTextContent(`player:${records[1].slug}`);
  });

  it('applies dynamic metadata filters from the player', async () => {
    const records = makeSampleRecords();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[`/${records[0].slug}`]}>
        <Routes>
          <Route path="/:slug?" element={<Harness records={records} />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole('button', { name: 'filter-author' })[0]);
    expect(screen.getByText(/Author:/)).toBeInTheDocument();
    expect(screen.getAllByText(records[0].author).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'filter-title' })[0]);
    expect(screen.getAllByPlaceholderText('Search... concept, person, keywords...').some((input) => (input as HTMLInputElement).value.length > 0)).toBe(true);

    await user.click(screen.getAllByRole('button', { name: 'filter-category' })[0]);
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value.length).toBeGreaterThan(0);
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
