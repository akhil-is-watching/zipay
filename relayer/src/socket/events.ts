export const CLIENT_EVENTS = {
  PING: 'client:ping',
} as const;

export type ClientEventName = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];

export const SERVER_EVENTS = {
  WELCOME: 'server:welcome',
  PONG: 'server:pong',
} as const;

export type ServerEventName = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];
