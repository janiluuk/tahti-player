import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProfileSection } from './ProfileSection';

describe('ProfileSection', () => {
  afterEach(cleanup);

  it('names the section after its heading and shows its content', () => {
    render(
      <ProfileSection title="Releases">
        <p>Night Drive EP</p>
      </ProfileSection>,
    );
    const section = screen.getByRole('region', { name: 'Releases' });
    expect(section).toContainElement(screen.getByText('Night Drive EP'));
    expect(
      screen.getByRole('heading', { level: 2, name: 'Releases' }),
    ).toBeInTheDocument();
  });

  it('drops the heading when no title is given', () => {
    render(
      <ProfileSection>
        <p>Tracks</p>
      </ProfileSection>,
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('shows the loading label instead of the content', () => {
    render(
      <ProfileSection title="Tracks" status="loading" loadingLabel="Loading…">
        <p>Polar Static</p>
      </ProfileSection>,
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Polar Static')).toBeNull();
  });

  it('shows the error with a retry button', () => {
    const onRetry = vi.fn();
    render(
      <ProfileSection
        title="Tracks"
        status="error"
        errorTitle="Tracks couldn't load"
        errorDescription="The rest still works."
        onRetry={onRetry}
      >
        <p>Polar Static</p>
      </ProfileSection>,
    );
    expect(screen.getByText("Tracks couldn't load")).toBeInTheDocument();
    expect(screen.getByText('The rest still works.')).toBeInTheDocument();
    expect(screen.queryByText('Polar Static')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty state when one is given', () => {
    render(
      <ProfileSection
        title="Tracks"
        empty={{ title: 'No public tracks yet', description: 'Check back.' }}
      >
        <p>Polar Static</p>
      </ProfileSection>,
    );
    expect(screen.getByText('No public tracks yet')).toBeInTheDocument();
    expect(screen.getByText('Check back.')).toBeInTheDocument();
    expect(screen.queryByText('Polar Static')).toBeNull();
  });
});
