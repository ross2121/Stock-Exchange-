export const subscribe="SUBSCRIBE";
export const unsubscribe="UNSUBCRIBE";
export type subscribeMessage={
    method:typeof subscribe,
    params:string[]
}
export type unsubscribeMessage={
    method:typeof unsubscribe,
    params: string[]
}
export type Incomingmessage=subscribeMessage|unsubscribeMessage