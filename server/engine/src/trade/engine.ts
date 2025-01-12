import { ReddisManager } from "../redismanager"
import { ORDER_UPDATE, TRADE_ADDED } from "../types"
import { MessagefromAPi,CANCEL_ORDER,CREATE_ORDER, GET_OPEN_ORDERS, GET_DEPTH } from "../types/fromapi"
import { ON_RAMP } from "../types/toapi"
import { Fill, Orderbook } from "./Orderbook"
import { Order } from "./Orderbook"
import fs from "fs-extra"
interface UserBalance{
    [key:string]:{
        avilable:number,
        locked:number
    }
}
const WITH_SNAPSHOT="true";

export const BASE_CURRENCY="INR"
export class Engine{
private orderbooks:Orderbook[]=[]
    private balances:Map<String,UserBalance>=new Map();
   constructor(){
    let snapshot=null
    try{
        if(WITH_SNAPSHOT=="true"){
            snapshot=fs.readFileSync("./snapshot.json");

        }
    }catch(e){
        console.log("No snapshot found");
    }
    if(snapshot){
        const snapshotSnapshot=JSON.parse(snapshot.toString());
        this.orderbooks=snapshotSnapshot.orderbooks.map((o:any)=>new Orderbook(o.baseAsset,o.bids,o.asks,o.lastTradeId,o.currentPrice));
        this.balances=new Map(snapshotSnapshot.balances);
    

    }else{
        this.orderbooks=[new Orderbook(`TATA`,[],[],0,0)];
        this.setBaseBalance();

    }
    setInterval(()=>{
        this.savesnapshot();
    },1000*3);
   }
   savesnapshot(){
    const snapshot={
    orderbooks:this.orderbooks.map(o=>o.getSnapshot()),
    balances:Array.from(this.balances.entries())
    }
    fs.writeFileSync("./snapshot.json",JSON.stringify(snapshot));
   }
   setBaseBalance(){
    this.balances.set("1",{
        [BASE_CURRENCY]:{
            avilable:10000000,
            locked:0
        },
        "TATA":{
            avilable:10000000,
            locked:0
        }
    });
    
    this.balances.set("2", {
        [BASE_CURRENCY]: {
            avilable: 10000000,
            locked: 0
        },
        "TATA": {
            avilable: 10000000,
            locked: 0
        }
    });

    this.balances.set("5", {
        [BASE_CURRENCY]: {
        avilable: 10000000,
            locked: 0
        },
        "TATA": {
            avilable: 10000000,
            locked: 0
        }
    });
   }
   
    chechandLockfunds(baseAsset:string,quoteAsset:string,side:"buy"|"sell",userId:string,price:string,quantity:string){
        if(side==="buy"){
            if((this.balances.get(userId)?.[quoteAsset]?.avilable||0)<(Number(quantity)*Number(price))){
             throw new Error("Insufficent funds");   
            }
        //    @ts-ignore
            this.balances.get(userId)[quoteAsset].avilable=this.balances.get(userId)?.[quoteAsset].avilable-(Number(quantity)*Number(price));
            // @ts-ignore
            this.balances.get(userId)[quoteAsset].locked=this.balances.get(userId)?.[quoteAsset].locked+(Number(quantity)*Number(price));
        }else{
            if((this.balances.get(userId)?.[baseAsset]?.avilable||0)<(Number(quantity))){
                throw new Error("Insufficent funds");      
            }
            // @ts-ignore
            this.balances.get(userId)[baseAsset].avilable=this.balances.get(userId)?.[baseAsset].avilable-(Number(quantity));
            // @ts-ignore
            this.balances.get(userId)[baseAsset].locked=this.balances.get(userId)?.[baseAsset].locked+(Number(quantity));
        }
    }
    onRamp(userId:string,amount:number){
        const UserBalance=this.balances.get(userId);
        if(!UserBalance){
            this.balances.set(userId,{
                [BASE_CURRENCY]:{
                    avilable:amount,
                    locked:0
                }
            })
        }else{
            UserBalance[BASE_CURRENCY].avilable+amount;
        }
    }
    updateBalance(userId:string,baseAsset:string,quoteAsset:string,side:"buy"|"sell",fills:Fill[]){
        if(side=="buy"){
            fills.forEach(fill=>{
                // @ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].avilable=this.balances.get(fill.otherUserId)?.[quoteAsset].avilable+(fill.qty*fill.price)
                // @ts-ignore
                this.balances.get(userId)[quoteAsset].locked=this.balances.get(userId)?.[quoteAsset].locked-(fill.qty*fill.price);
                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].locked=this.balances.get(fill.otherUserId)?.[baseAsset].locked-fill.qty;

                // @ts-ignore
                this.balances.get(userId)[baseAsset].avilable=this.balances.get(userId)?.[baseAsset].avilable+fill.qty;

            })
        }else{
            fills.forEach(fill=>{
                // @ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].locked-(fill.qty*fill.price);
                //@ts-ignore
                this.balances.get(userId)[quoteAsset].avilable=this.balances.get(userId)?.[quoteAsset].avilable+(fill.qty*fill.price);
                // @ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].avilable=this.balances.get(fill.otherUserId)?.[baseAsset].avilable+fill.qty;
                //@ts-ignore
                this.balances.get(userId)[baseAsset].locked=this.balances.get(userId)?.[baseAsset].locked-(fill.qty);

            })
        }
    }
    sendupdatedDepthat(price:string,market:string){
        const orderbook=this.orderbooks.find(o=>o.ticker()===market);
        if(!orderbook){
            return;
        }
        const depth=orderbook.getDepth();
        const updatedBids=depth?.bids.filter(x=>x[0]===price);
        const updateAsks=depth?.asks.filter(x=>x[0]===price);
        ReddisManager.getInstance().publishMessage(`depth@${market}`,{
            stream:`depth@${market}`,
            data:{
                a:updateAsks.length ?updateAsks:[[price,"0"]],
                b:updatedBids.length?updatedBids:[[price,"0"]],
                e:"depth",
            }
        })
    }
    publicWstrades(fills:Fill[],userId:string,market:string){
        fills.forEach(fill=>{
            ReddisManager.getInstance().publishMessage(`trades@${market}`,{
                stream:`trade@${market}`,
                data:{
                    e:"trade",
                    t:fill.tradeId,
                    m:fill.otherUserId===userId,
                    p:fill.price,
                   q:fill.qty.toString(),
                   s:market,
                }
            })

        })
    }
    createDbtrades(fills:Fill[],market:string,userId:string){
fills.forEach(fill=>{
    ReddisManager.getInstance().pushMessage({
        type:TRADE_ADDED,
        data:{
            market:market,
            id:fill.tradeId.toString(),
            isBuyerMarker:fill.otherUserId===userId,
            price:fill.price,
            quantity:fill.qty.toString(),
            quoteQuantity:(fill.qty*Number(fill.price)).toString(),
            timestamp:Date.now()
        }
    })
})

    }
    process({message,clientId}:{message:MessagefromAPi,clientId:string}){
        switch(message.type){
            case CREATE_ORDER:
                 try{
                    const {executedQty,fills,orderID}=this.createOrder(message.data.market,message.data.price,message.data.quantity,message.data.side,message.data.userId);
                
                    ReddisManager.getInstance().sendToApi(clientId,{
                        type:"ORDER_PLACED",
                        payload:{
                            orderID,
                            executedQty,
                            fills
                        }
                    });
                 }catch(e){
                    console.log(e);
                    ReddisManager.getInstance().sendToApi(clientId,{
                        type:"ORDER_CANCELLED",
                        payload:{
                            orderId:"",
                            executedQty:0,
                            remainingQty:0
                        }
                    })
                 }
                 break;
                case CANCEL_ORDER:
                    try {
                        const orderid=message.data.orderId;
                        const cancelMarket=message.data.market;
                        const cancelorderbook=this.orderbooks.find(o=>o.ticker()===cancelMarket);
                        if(!cancelorderbook){
                        throw new Error("No orderbook found");
                        }
                        const quoteAsset=cancelMarket.split("_")[1];
                        const order=cancelorderbook.asks.find(o=>o.orderId==orderid)||cancelorderbook.bids.find(o=>o.orderId===orderid);
                        if(!order){
                        throw new Error("No order found");
                        }
                        if(order.side==="buy"){
                        const price=cancelorderbook.cancelBid(order);
                        const leftamount=(order.quantity-order.filled)*order.price;
                    // @ts-ignore
                    this.balances.get(order.userId)[BASE_CURRENCY].avilable+=leftamount;
                    // @ts-ignore
                    this.balances.get(order.userId)[BASE_CURRENCY].locked-=leftamount;
                    if(price){
                        this.sendupdatedDepthat(price.toString(),cancelMarket);
                    }
                        }else{
                            const price=cancelorderbook.cancelAsk(order);
                            const leftquantity=order.quantity-order.filled;
                            // @ts-ignore
                            this.balances.get(order.userId)[quoteAsset].avilable+=leftquantity;
                            // @ts-ignore
                            this.balances.get(order.userId)[quoteAsset].locked-=leftquantity;
                            if(price){
                                this.sendupdatedDepthat(price.toString(),cancelMarket);
                            }
                        }
                       ReddisManager.getInstance().sendToApi(clientId,{
                        type:"ORDER_CANCELLED",
                        payload:{
                            orderId:orderid,
                            executedQty:0,
                            remainingQty:0,
                        }
                       })
                    } catch (error) {
                        console.log("Error while canceling the order",error);

                    }break;
                    case GET_OPEN_ORDERS:
                    try {
                        const openorderBook=this.orderbooks.find(o=>o.ticker()===message.data.market);
                           if(!openorderBook){
                            throw new Error("NO orderbook found");

                           }
                          
                         const opendOrders=openorderBook.getopenorders(message.data.usedId);
                          ReddisManager.getInstance().sendToApi(clientId,{
                            type:"OPEN_ORDERS",
                            payload:opendOrders
                          })
                        } catch (error) {
                     console.log(error)   
                    }
                    break;
                    case ON_RAMP:
                        const userId=message.data.userId;
                        const amount=Number(message.data.amount);
                        this.onRamp(userId,amount);
                        break;
                    case GET_DEPTH:
                        try {
                            const market=message.data.market;
                            const orderbook=this.orderbooks.find(o=>o.ticker()===market);
                            if(!orderbook){
                                throw new Error("No oderbook found");

                            }
                            ReddisManager.getInstance().sendToApi(clientId,{
                                type:"DEPTH",
                                payload:orderbook.getDepth()
                            })
                        } catch (error) {
                            console.log(error);
                            ReddisManager.getInstance().sendToApi(clientId,{
                                type:"DEPTH",
                                payload:{
                                    bids:[],
                                    asks:[]
                                }
                            })
                        }
                        break;
        }
    }
    updateDborders(order:Order,executedQty:number,fills:Fill[],market:string){
        ReddisManager.getInstance().pushMessage({
            type:ORDER_UPDATE,
            data:{
                orderId:order.orderId,
                executedQty:executedQty,
                market:market,
                price:order.price.toString(),
                quantity:order.quantity.toString(),
                side:order.side,
            }
        })
        fills.forEach(fill=>{
            ReddisManager.getInstance().pushMessage({
                type:ORDER_UPDATE,
                data:{
                    orderId:fill.marketOrderId.toString(),
                    executedQty:fill.qty
                }
            })
        })
    }
    createOrder(market:string,price:string,quantity:string,side:"buy"|"sell",userId:string){
        const orderbook=this.orderbooks.find(o=>o.ticker()===market)
       if(!orderbook){
        throw new Error("No orderbook found");;
       }
        const baseAsset=market.split("_")[0];
        const quoteAsset=market.split("_")[1];
       this.chechandLockfunds(baseAsset,quoteAsset,side,userId,price,quantity);
       const order:Order={
        price:Number(price),
        quantity:Number(quantity),
        orderId:Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),
        filled:0,
        side,
        userId
       }
       const {fills,executedQty}=orderbook.addorder(order);
       this.updateBalance(userId,baseAsset,quoteAsset,side,fills);
       this.createDbtrades(fills,market,userId);
       this.updateDborders(order,executedQty,fills,market);
       this.publicwsDepthUpdates(fills,price,side,market);
       this.publicWstrades(fills,userId,market);
       return {executedQty,fills,orderID:order.orderId};  
    }
    publicwsDepthUpdates(fill:Fill[],price:string,side:"buy"|"sell",market:string){
        const orderbook=this.orderbooks.find(o=>o.ticker()===market);
        if(!orderbook){
            return;
        }
        const depth=orderbook.getDepth();
        if(side==="buy"){
            const updateAsks=depth?.asks.filter(x=>fill.map(f=>f.price).includes(x[0].toString()))
            const updatebid=depth?.bids.find(x=>x[0]==price);
            ReddisManager.getInstance().publishMessage(`depth@${market}`,{
                stream:`depth@${market}`,
                data:{
                    a:updateAsks,
                    b:updatebid?[updatebid]:[],
                    e:"depth"
                }
            })
        }
        if(side==="sell"){
            const updatebids=depth?.bids.filter(x=>fill.map(f=>f.price).includes(x[0].toString()));
            const updateAsks=depth?.asks.find(x=>x[0]===price);
            ReddisManager.getInstance().publishMessage(`depth@${market}`,{
                stream:`depth@${market}`,
                data:{
                    a:updateAsks?[updateAsks]:[],
                    b:updatebids,
                    e:"depth"
                }
            })
        }
    }

}