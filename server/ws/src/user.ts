import {WebSocket} from "ws";
import { outgoingMessage } from "./types/out";
import { SubscriptionManager } from "./SubscriptionManager";
import { Incomingmessage,subscribe,unsubscribe } from "./types/in";
export class User{
    private id:string;
    private ws:WebSocket;
    constructor(id:string,ws:WebSocket){
        this.id=id;
        this.ws=ws;
        this.addListneres()
    }
    emit(message:outgoingMessage){
        this.ws.send(JSON.stringify(message));
    }
    private subscriptions:string[]=[]
    public subscribe(subscription:string){
        this.subscriptions.push(subscription);
    }
    public unscriber(subscription:string){
        this.subscriptions=this.subscriptions.filter(s=>s!==subscription);
    }

    private addListneres(){
        this.ws.on("message",(message:string)=>{
            const parsedMessage:Incomingmessage=JSON.parse(message);
            if(parsedMessage.method===subscribe){
             parsedMessage.params.forEach(s=>SubscriptionManager.getInstance().subscribe(this.id,s));
    
            }
            if(parsedMessage.method===unsubscribe){
                parsedMessage.params.forEach(s=>SubscriptionManager.getInstance().unsubscriber(this.id,parsedMessage.params[0]));
            }

        })
    }
}
