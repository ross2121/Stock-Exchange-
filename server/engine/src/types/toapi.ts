export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}
export const CREATE_ORDER="CREATE_ORDER";
export const CANCEL_ORDER="CANCEL ORDER";
export const ON_RAMP="ON_RAMP";
export const GET_DEPTH="GET_DEPTH"
export type MessagetoAPi={
    type:"DEPTH",
    payload:{
        bids:[string,string][],
        asks:[string,string][]
    }
}|{
    type:"ORDER_PLACED",
    payload:{
        orderID:string,
        executedQty:number,
        fills:{
            price:string,
            qty:number,
            tradeId:number,
        }[]
    }
}|{
    type:"ORDER_CANCELLED",
    payload:{
        orderId:string,
        executedQty:number,
        remainingQty:number,
    }
}|{
    type:"OPEN_ORDERS",
    payload:Order[]
}