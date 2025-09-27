export const CLIENT_EVENTS = {
  PING: 'client:ping',
  QUOTE_REQUEST: 'client:quote-request',
} as const;

export type ClientEventName = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];

export const SERVER_EVENTS = {
  WELCOME: 'server:welcome',
  PONG: 'server:pong',
  QUOTE_RESPONSE: 'server:quote-response',
} as const;

export type ServerEventName = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];
