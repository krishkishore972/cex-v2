import { createClient, type RedisClientType } from "redis";

type OrderResponse = {
    identifier:string,
    filledQty:number,
}

type PendingResolve = {
    resolve:(value:OrderResponse) => void,
    reject:(reason:any) => void,
    timeout:NodeJS.Timeout
}


class RedisManager {

  private static instance:RedisManager; 
  private client: RedisClientType;
  private subscriber: RedisClientType;

  private queueId:string = crypto.randomUUID();
  private pendingResponses: Map<String,PendingResolve>;

  constructor() {
    this.client = createClient();
    this.subscriber = createClient();
    this.pendingResponses = new Map();
    this.initClients();
  }

  private async initClients() {
    try {
      await this.client.connect();
      await this.subscriber.connect();
      this.pollResponseQueue();
    } catch (error) {
        console.log('err while connecting to redis',error);
    }
  }

async sendOrder(data:any) {
  const identifier = crypto.randomUUID();

  await this.client.lPush("incoming_order", JSON.stringify({
    ...data,
    identifier,
    queueId:this.queueId
  }))

  return this.waitForResponse(identifier);
}

private waitForResponse(identifier:string):Promise<OrderResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      this.pendingResponses.delete(identifier);
      reject(new Error("Response timed out"));
    }, 10_000);

    this.pendingResponses.set(identifier, { resolve, reject, timeout});
  })
}

private async pollResponseQueue() {
  while (true) {
    try {
      const response = await this.subscriber.brPop(this.queueId, 0);
      if(!response) continue;
      const parsedResponse:OrderResponse = JSON.parse(response.element);
      const pending = this.pendingResponses.get(parsedResponse.identifier);
      if(!pending) continue;
      clearTimeout(pending.timeout);
      pending.resolve(parsedResponse);
      this.pendingResponses.delete(parsedResponse.identifier);
    } catch (error) {
      console.error('Error occurred while polling response queue:', error);
    }
  }
}


  static getInstance():RedisManager{
    if (!RedisManager.instance) {
        RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }
}

export const redisManager = RedisManager.getInstance();


