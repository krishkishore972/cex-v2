import fs from "fs";
import { redisManager } from "@repo/redis";
import { OrderBook } from "./orderBook";
import type {MessageFromApi} from "@repo/common"



interface UserBalance {
    [key:string] : {
        available:number,
        reserved:number
    }
}


export const BASE_CURRENCY = "INR";

export class Engine {

    private orderBooks: OrderBook[] = [];
    private userBalances: Map<string,UserBalance> = new Map();

    constructor(){

        let snapshot = null;

        try {
            if (process.env.WITH_SNAPSHOT) {
                snapshot = fs.readFileSync("./snapshot.json")
            }
        } catch (error) {
            console.log("no snapshot found")
        }

        if (snapshot) {

            const snapshotSnapShot = JSON.parse(snapshot.toString());
            this.orderBooks = snapshotSnapShot.orderBooks.map((o:any) => new OrderBook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.userBalances = new Map(snapshotSnapShot.userBalances);
        } else {
            this.orderBooks = [new OrderBook(`TATA`,[],[],0,0)];
            this.setBaseBalances();
        }

        setInterval(() => {
            this.saveSnapShot();
        },3000);
    }

    saveSnapShot(){
        const snapshotSnapShot = {
            orderBooks: this.orderBooks.map((o) => o.getSnapShot),
            userBalances: Array.from(this.userBalances.entries())
        }
        fs.writeFileSync("./snapshot.json",JSON.stringify(snapshotSnapShot));
    }

    process({message,clientId}:{message: MessageFromApi,clientId:string}){
        
        
    }
}
