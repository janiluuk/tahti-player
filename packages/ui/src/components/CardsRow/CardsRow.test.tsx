import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CardsRowWrapper as Wrapper } from './CardsRow.test-wrapper';

describe('CardsRow', () => {
  beforeEach(() => {
    Wrapper.overflow(2000, 800);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('(Snapshot) renders correctly with items', () => {
    const { container } = Wrapper.mount();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('names the filter box after its placeholder', () => {
    Wrapper.mount();

    expect(screen.getByTestId('cards-row-filter')).toHaveAccessibleName();
  });

  it('renders all card titles when no filter is applied', () => {
    Wrapper.mount();

    expect(Wrapper.card('Midnight Drive')).toBeInTheDocument();
    expect(Wrapper.card('Northern Lights')).toBeInTheDocument();
    expect(Wrapper.card('Echoes of Silence')).toBeInTheDocument();
  });

  it('filters cards by title when user types in the filter input', async () => {
    Wrapper.mount();

    await Wrapper.filter.type('midnight');

    expect(Wrapper.card('Midnight Drive')).toBeInTheDocument();
    expect(Wrapper.card('Northern Lights')).not.toBeInTheDocument();
    expect(Wrapper.card('Echoes of Silence')).not.toBeInTheDocument();
  });

  it('shows nothing found state when filter matches no cards', async () => {
    Wrapper.mount();

    await Wrapper.filter.type('zzzzz');

    expect(Wrapper.nothingFound).toBeInTheDocument();
    expect(Wrapper.cards).toHaveLength(0);
  });

  it('clears the filter from the nothing-found empty action', async () => {
    Wrapper.mount();

    await Wrapper.filter.type('zzzzz');
    expect(Wrapper.nothingFound).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('cards-row-nothing-found-clear'));
    expect(Wrapper.cards).toHaveLength(3);
    expect(Wrapper.filter.input).toHaveValue('');
  });

  it('clears the filter when the clear filter button is clicked', async () => {
    Wrapper.mount();

    await Wrapper.filter.type('midnight');
    expect(Wrapper.cards).toHaveLength(1);

    await Wrapper.filter.clear();
    expect(Wrapper.cards).toHaveLength(3);
    expect(Wrapper.filter.input).toHaveValue('');
  });

  it('renders a badge next to the title when badge is set', () => {
    Wrapper.mount({ badge: 'Acme Music' });

    expect(Wrapper.badge).toBeInTheDocument();
    expect(Wrapper.badge).toHaveTextContent('Acme Music');
  });

  it('applies the section badge color class', () => {
    Wrapper.mount({ badge: 'Live', badgeColor: 'green' });

    expect(Wrapper.badge).toHaveClass('bg-accent-green');
  });

  it('does not render a badge when badge is not set', () => {
    Wrapper.mount();

    expect(Wrapper.badge).not.toBeInTheDocument();
  });

  it('calls onClick when a card is clicked', async () => {
    const handleClick = vi.fn();
    Wrapper.mount({
      items: [{ id: '1', title: 'Clickable Album', onClick: handleClick }],
    });

    await userEvent.click(Wrapper.card('Clickable Album')!);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('hides the filter and scroll buttons when every card fits, keeps the zoom control', () => {
    Wrapper.overflow(600, 800);
    Wrapper.mount({ defaultLayout: 'cards' });

    expect(screen.queryByTestId('cards-row-filter')).toBeNull();
    expect(screen.queryByTestId('cards-row-scroll-left')).toBeNull();
    expect(screen.getByTestId('cards-row-zoom')).toBeInTheDocument();
  });

  it('disables the left arrow at the start of the row and keeps the arrows neutral', () => {
    Wrapper.mount({ defaultLayout: 'cards' });

    const left = screen.getByTestId('cards-row-scroll-left');
    const right = screen.getByTestId('cards-row-scroll-right');
    expect(left).toBeDisabled();
    expect(right).toBeEnabled();
    expect(right.className).not.toContain('bg-primary');
  });

  it('shows the filter and scroll buttons when cards overflow the row', () => {
    Wrapper.mount({ defaultLayout: 'cards' });

    expect(screen.getByTestId('cards-row-filter')).toBeInTheDocument();
    expect(screen.getByTestId('cards-row-scroll-left')).toBeInTheDocument();
  });

  it('keeps the filter visible while a filter is applied', async () => {
    Wrapper.mount({ defaultLayout: 'cards' });
    Wrapper.overflow(200, 800);

    await Wrapper.filter.type('midnight');

    expect(screen.getByTestId('cards-row-filter')).toBeInTheDocument();
  });

  it('zooms between list, cards and full artwork, greying out the ends', async () => {
    Wrapper.mount({ defaultLayout: 'cards' });
    const zoomIn = () => screen.getByTestId('cards-row-zoom-in');
    const zoomOut = () => screen.getByTestId('cards-row-zoom-out');

    expect(Wrapper.container).toHaveAttribute('data-layout', 'cards');
    expect(zoomIn()).toHaveAccessibleName('Show full artwork');
    expect(zoomOut()).toHaveAccessibleName('Show as list');
    await userEvent.click(zoomIn());
    expect(Wrapper.container).toHaveAttribute('data-layout', 'full');
    expect(screen.getByTestId('cards-row-full')).toBeInTheDocument();
    expect(zoomIn()).toBeDisabled();
    await userEvent.click(zoomOut());
    await userEvent.click(zoomOut());
    expect(Wrapper.container).toHaveAttribute('data-layout', 'list');
    expect(screen.getByTestId('cards-row-list')).toBeInTheDocument();
    expect(zoomOut()).toBeDisabled();
    expect(zoomIn()).toBeEnabled();
  });
});

describe('CardsRow without a filter', () => {
  it('keeps the layout toggle and drops the filter box', async () => {
    const { render } = await import('@testing-library/react');
    const { CardsRow } = await import('./CardsRow');
    render(
      <CardsRow
        title="Recently played"
        items={[{ id: 'a', title: 'A' }]}
        labels={{ filterPlaceholder: 'Filter…', nothingFound: 'None' }}
        filterable={false}
        defaultLayout="cards"
      />,
    );
    expect(screen.queryByTestId('cards-row-filter')).toBeNull();
    expect(screen.getByTestId('cards-row-zoom')).toBeTruthy();
  });
});

describe('CardsRow with custom cards', () => {
  it('draws a rendered Card as a row in list view and full width in full view', async () => {
    const { render } = await import('@testing-library/react');
    const { CardsRow } = await import('./CardsRow');
    const { Card } = await import('../Card');
    const props = {
      title: 'Tahti Selects',
      items: [{ id: 'a', title: 'Aurora' }],
      labels: { filterPlaceholder: 'Filter…', nothingFound: 'None' },
      renderItem: (item: { id: string; title: string }) => (
        <Card title={item.title} onPlay={() => undefined} />
      ),
    };
    const { rerender } = render(<CardsRow {...props} layout="list" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-layout', 'row');
    rerender(<CardsRow {...props} layout="full" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-layout', 'full');
    expect(screen.getByTestId('card').className).toContain('w-full');
    rerender(<CardsRow {...props} layout="cards" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-layout', 'card');
  });

  it('draws list rows with the TrackTable stripes and dividers', async () => {
    Wrapper.mount();
    await userEvent.click(screen.getByTestId('cards-row-zoom-out'));
    const rows = screen.getByTestId('cards-row-list').querySelectorAll('li');
    expect(rows[0].className).toMatch(/bg-background-secondary/);
    expect(rows[1].className).toMatch(/(^| )bg-background( |$)/);
    expect(rows[0].className).toMatch(/border-b-/);
  });
});
