export type TickerUpdateMessage={
    stream:string,
    data:{
        c?:string,
        h?:string,
        l?:string,
        v?:string,
        V?:string,
        s?:string,
        id:number,
        e:"ticker"
    }
}
export type DepthUpdateMessge={
    stream:string,
    data:{
        b?:[string,string][],
        a?:[string,string][],
        e:"depth"
    }
}
export type TradeAddedMessage={
    stream:string,
    data:{
        e:"trade",
        t:number,
        m:boolean,
        p:string,
        q:string,
        s:string
    }
}
export type wsMessage=TickerUpdateMessage|DepthUpdateMessge|TradeAddedMessage