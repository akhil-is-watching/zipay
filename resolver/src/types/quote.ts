export type QuoteRequestPayload = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
};
export type QuoteResponsePayload = QuoteRequestPayload & {
  fromChainAmount: string;
};
