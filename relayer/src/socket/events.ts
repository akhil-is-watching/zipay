export const CLIENT_EVENTS = {
  PING: 'client:ping',
  QUOTE_REQUEST: 'client:quote-request',
} as const;

export type ClientEventName = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];

export const SERVER_EVENTS = {
  WELCOME: 'server:welcome',
  PONG: 'server:pong',
  QUOTE_RESPONSE: 'server:quote-response',
  QUOTE_REQUEST: 'server:quote-request',
} as const;

export type ServerEventName = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];

export const RESOLVER_EVENTS = {

  QUOTE_RESPONSE: 'resolver:quote-response',
}

export type ResolverEventName = typeof RESOLVER_EVENTS[keyof typeof RESOLVER_EVENTS];