import { BASE_CURRENCY } from "./Engine";

export interface Order {
  orderId: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
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
  baseAsset: string;
  quoteAsset: string = BASE_CURRENCY;
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string,
    asks: Order[],
    bids: Order[],
    lastTradeId: number,
    currentPrice: number,
  ) {
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
      currentPrice: this.currentPrice,
    };
  }

  ticker() {
    return `${this.baseAsset}/${this.quoteAsset}`;
  }

  addOrder(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    if (order.side == "buy") {
      const { executedQty, fills } = this.matchAsks(order);
      order.filledQuantity = executedQty;

      if (executedQty == order.quantity) {
        return {
          executedQty,
          fills,
        };
      }

      this.bids.push(order);
      return {
        executedQty,
        fills,
      };
    } else {
      const { executedQty, fills } = this.matchBids(order);
      order.filledQuantity = executedQty;

      if (executedQty == order.quantity) {
        return {
          executedQty,
          fills,
        };
      }

      this.asks.push(order);
      return {
        executedQty,
        fills,
      };
    }
  }

  matchAsks(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    this.asks.sort((a, b) => a.price - b.price);

    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.asks.length && executedQty < order.quantity; i++) {
      const ask = this.asks[i]!;
      if (ask.price > order.price) break;

      const remainingIncoming = order.quantity - executedQty;
      const remainingAsks = ask.quantity - ask.filledQuantity;
      const fillQty = Math.min(remainingAsks, remainingIncoming);

      executedQty += fillQty;
      ask.filledQuantity += fillQty;
      this.currentPrice = ask.price;

      fills.push({
        price: String(ask.price),
        quantity: fillQty,
        tradeId: ++this.lastTradeId,
        counterpartyUserId: ask.userId,
        makerOrderId: ask.orderId,
      });
    }

    this.asks = this.asks.filter((ask) => ask.filledQuantity < ask.quantity);

    return {
      executedQty,
      fills,
    };
  }

  matchBids(order: Order): {
    executedQty: number;
    fills: Fill[];
  } {
    this.bids.sort((a, b) => b.price - a.price);

    let executedQty = 0;
    const fills: Fill[] = [];

    for (let i = 0; i < this.bids.length && executedQty < order.quantity; i++) {
      const bid = this.bids[i]!;

      if (bid.price < order.price) break;

      const remainingIncoming = order.quantity - executedQty;
      const remainingBids = bid.quantity - bid.filledQuantity;
      const fillQty = Math.min(remainingBids, remainingIncoming);

      executedQty += fillQty;
      bid.filledQuantity += fillQty;
      this.currentPrice = bid.price;

      fills.push({
        price: String(bid.price),
        quantity: fillQty,
        tradeId: ++this.lastTradeId,
        counterpartyUserId: bid.userId,
        makerOrderId: bid.orderId,
      });
    }

    this.bids = this.bids.filter((bid) => bid.filledQuantity < bid.quantity);

    return {
      executedQty,
      fills,
    };
  }

  getDepth(): {
    asks: [number, number][];
    bids: [number, number][];
  } {
    const asks: [number, number][] = [];
    const bids: [number, number][] = [];

    const askDepth = new Map<number, number>();
    const bidDepth = new Map<number, number>();

    for (const ask of this.asks) {
      const remainingQty = ask.quantity - ask.filledQuantity;
      if (remainingQty <= 0) {
        continue;
      }
      askDepth.set(ask.price, (askDepth.get(ask.price) || 0) + remainingQty);
    }

    for (const bid of this.bids) {
      const remainingQty = bid.quantity - bid.filledQuantity;
      if (remainingQty <= 0) {
        continue;
      }
      bidDepth.set(bid.price, (bidDepth.get(bid.price) || 0) + remainingQty);
    }

    for (const [price, quantity] of askDepth) {
      asks.push([price, quantity]);
    }

    for (const [price, quantity] of bidDepth) {
      bids.push([price, quantity]);
    }

    asks.sort((a, b) => a[0] - b[0]);
    bids.sort((a, b) => b[0] - a[0]);

    return {
      asks,
      bids,
    };
  }

  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter((ask) => ask.userId === userId);
    const bids = this.bids.filter((bid) => bid.userId === userId);
    return [...asks, ...bids];
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((bid) => bid.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index]?.price;
      this.bids.splice(index, 1);
      return price;
    }
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((ask) => ask.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index]?.price;
      this.asks.splice(index, 1);
      return price;
    }
  }
}
