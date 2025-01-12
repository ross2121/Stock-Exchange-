import { RedisClientType,createClient } from "redis";
import { ORDER_UPDATE,TRADE_ADDED } from "./types";
import { wsMessage } from "./types/tows";
import { MessagetoAPi } from "./types/toapi";
type DbMessage={
    type:typeof TRADE_ADDED
    data:{
        id:string,
        isBuyerMarker:boolean,
        price:string,
        quantity:string,
        quoteQuantity:string,
        timestamp:number,
        market:string
    }
}|{
    type:typeof ORDER_UPDATE,
    data:{
        orderId:string,
        executedQty:number,
        market?:string,
        price?:string,
        quantity?:string,
         side?:"buy"|"sell"
    }
}
export class ReddisManager{
    private client:RedisClientType;
    private static instanace:ReddisManager;
    constructor(){
        this.client=createClient();
        this.client.connect();
    }
    public static getInstance(){
        if(!this.instanace){
            this.instanace=new ReddisManager();
        }
        return this.instanace
    }
    public pushMessage(message:DbMessage){
        this.client.lPush("db_processor",JSON.stringify(message));

    }
    public publishMessage(channel:string,message:wsMessage){
        this.client.publish(channel,JSON.stringify(message));

    }
    public sendToApi(clientId:string,message:MessagetoAPi){
        this.client.publish(clientId,JSON.stringify(message))
    }
}