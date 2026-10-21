import { render, screen } from '@testing-library/react';

import { TrackProcessing } from '.';

describe('TrackProcessing', () => {
  it('announces "Processing" as a status', () => {
    render(<TrackProcessing />);

    expect(screen.getByRole('status')).toHaveTextContent('Processing');
  });

  it('takes a custom label', () => {
    render(<TrackProcessing variant="waveform" label="Building waveform" />);

    expect(screen.getByRole('status')).toHaveTextContent('Building waveform');
  });

  it('stays out of the accessibility tree when decorative', () => {
    render(<TrackProcessing variant="overlay" label="" decorative />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('(Snapshot) renders all variants', () => {
    const { container } = render(
      <div className="flex flex-col gap-4">
        <TrackProcessing />
        <div className="relative size-16">
          <TrackProcessing variant="overlay" />
        </div>
        <TrackProcessing variant="waveform" />
      </div>,
    );
    expect(container).toMatchSnapshot();
  });
});
