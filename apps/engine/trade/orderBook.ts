import { BASE_CURRENCY } from "./Engine";

export interface Order {
    orderId: string;
    price: number;
    quantity: number;
    side: 'buy' | 'sell';
    filledQuantity: number;
    userId: string;
}

export interface Fill {
    price: string;
    quantity: number;
    tradeId: number;
    counterpartyUserId: string;
    makerOrderId: string;
}



export class OrderBook {
    asks: Order[];
    bids: Order[];
    baseAsset: string
    quoteAsset: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;


    constructor(baseAsset: string, asks: Order[], bids: Order[], lastTradeId: number, currentPrice: number) {
        this.baseAsset = baseAsset;
        this.asks = asks;
        this.bids = bids;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
    }

    getSnapShot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }




}

