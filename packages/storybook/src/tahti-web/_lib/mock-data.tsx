import type { Decorator } from '@storybook/react-vite';
import {
  setMockOverrides,
  type MockOverrides,
} from '@tahti-web/api/mock-overrides';

export type {
  MockFixtureKey,
  MockFixtures,
  MockOverrides,
} from '@tahti-web/api/mock-overrides';

/**
 * Typed identity for `parameters.mockData`. Storybook types parameters as
 * `any`, so going through this keeps fixture keys and shapes checked.
 *
 * @example parameters: { mockData: mockData({ profile: { artist: { isMember: true } } }) }
 */
export function mockData(overrides: MockOverrides): MockOverrides {
  return overrides;
}

/**
 * Decorator form of `parameters.mockData`, for stories that already build
 * their decorator list. The global `beforeEach` in .storybook/preview.ts
 * resets the registry between stories either way.
 */
export function withMockData(overrides: MockOverrides): Decorator {
  return (Story) => {
    setMockOverrides(overrides);
    return <Story />;
  };
}
