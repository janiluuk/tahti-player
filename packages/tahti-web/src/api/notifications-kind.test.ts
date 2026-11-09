import { describe, expect, it } from 'vitest';

import { notificationKindOf } from './notifications';

describe('notificationKindOf', () => {
  it('files types under the same kinds as the API', () => {
    expect(notificationKindOf('NEW_FOLLOWER')).toBe('social');
    expect(notificationKindOf('NEW_RELEASE')).toBe('music');
    expect(notificationKindOf('PAYOUT_SENT')).toBe('money');
    expect(notificationKindOf('FEATURE_REQUEST_UPDATED')).toBe('governance');
    expect(notificationKindOf('SUPPORT_REPLY')).toBe('other');
    expect(notificationKindOf('SOMETHING_NEW')).toBe('other');
  });

  it('files the board-decision, venue and cancellation notices', () => {
    for (const type of [
      'RADIO_SUBMISSION_ACCEPTED',
      'RADIO_STATION_REVIEWED',
      'TRACK_EDITED_BY_BOARD',
      'CHANNEL_FORCED_OFFLINE',
      'VENUE_VERIFIED',
      'VENUE_SHOW_BOOKED',
      'VENUE_SHOW_CANCELED',
    ]) {
      expect(notificationKindOf(type)).toBe('music');
    }
    expect(notificationKindOf('FAN_SUB_CANCELED')).toBe('money');
    expect(notificationKindOf('ACCOUNT_RESTRICTED')).toBe('other');
    expect(notificationKindOf('TAHTI_SELECTS_PICK')).toBe('music');
    expect(notificationKindOf('TAHTI_RADIO_INCLUSION_CHANGED')).toBe('music');
    expect(notificationKindOf('GRANT_AWARDED')).toBe('money');
    expect(notificationKindOf('BOARD_ACCOUNT_CHANGE')).toBe('other');
    expect(notificationKindOf('ADDON_REVIEWED')).toBe('other');
    expect(notificationKindOf('TRACK_SHARED')).toBe('social');
    expect(notificationKindOf('GREEN_ROOM_INVITE')).toBe('social');
    expect(notificationKindOf('BACKGROUND_JOB_DONE')).toBe('music');
    expect(notificationKindOf('BACKGROUND_JOB_FAILED')).toBe('music');
    expect(notificationKindOf('MEMBERSHIP_ENDED')).toBe('money');
    expect(notificationKindOf('DISCUSSION_REPLY')).toBe('governance');
    expect(notificationKindOf('DISCUSSION_OPENED')).toBe('governance');
    expect(notificationKindOf('DISCUSSION_CLOSED')).toBe('governance');
    expect(notificationKindOf('DISCUSSION_MENTION')).toBe('governance');
    for (const type of [
      'GROUP_JOIN_REQUESTED',
      'GROUP_JOIN_RESOLVED',
      'GROUP_SUBMISSION_RECEIVED',
      'GROUP_SUBMISSION_RESOLVED',
      'GROUP_MEMBER_REMOVED',
      'GROUP_ROLE_CHANGED',
      'GROUP_DELETED',
    ]) {
      expect(notificationKindOf(type)).toBe('social');
    }
    for (const type of [
      'LISTENING_PARTY_SCHEDULED',
      'LISTENING_PARTY_STARTING',
      'LISTENING_PARTY_CHANGED',
    ]) {
      expect(notificationKindOf(type)).toBe('music');
    }
  });
});
