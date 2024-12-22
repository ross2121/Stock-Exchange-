export const Create_Order="Create_ORDER";
export const Cancel_Order="Cancel_ORDER";
export const ON_RAMP="RAMP_ORDER";
export const GET_OPEN_ORDER="GET_OPEN_ORDERS";
export const GET_DEPTH="GET_DEPTH";
console.log("dad");
export type MessageFromOrderbook={
type:"DEPTH",
payload:{
    market:string,
    bids:[string,string][],
    asks:[string,string][],
}
}|{
    type:"ORDER_PlACED",
    payload:{
        orderId:string,
        executedqty:number,
        fills:[
            {
                price:string,
                qty:number,
                tradeid:number,
            }
        ]
    }
}|{
    type:"ORDER_CANCELLED",
    payload:{
        orderId:string,
        executedqty:number,
        remainingqty:number
    }
}|{
    type:"OPEN_ORDERS",
    payload:{
        orderID:string,
        executedQty:number,
        price:string,
        quantity:string,
        side:"buy"|"sell",
        userId:string
    }[]
}
