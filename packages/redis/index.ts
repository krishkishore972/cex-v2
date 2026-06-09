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

/**
 * A manager for handling Redis operations related to order processing.
 */

class RedisManager {

  private static instance:RedisManager; 
  private client: RedisClientType;
  private subscriber: RedisClientType;

  private queueId:string = crypto.randomUUID();
  private pendingResponses: Map<string,PendingResolve>;

  // when the class is instantiated we connect to redis and start polling the response queue
  constructor() {
    this.client = createClient();
    this.subscriber = createClient();
    this.pendingResponses = new Map();
    this.initClients();
  }

// when the class is instantiated we connect to redis and start polling the response queue
  private async initClients() {
    try {
      await this.client.connect();
      await this.subscriber.connect();
      this.pollResponseQueue();
    } catch (error) {
        console.log('err while connecting to redis',error);
    }
  }

// when we send an order we push it to a redis list, we also generate a unique identifier for the order and include it in the data we push to redis, this identifier will be used to match the response with the pending promise
async sendOrder(data:any) {
  const identifier = crypto.randomUUID();

  await this.client.lPush("incoming_order", JSON.stringify({
    ...data,
    identifier,
    queueId:this.queueId
  }))

  return this.waitForResponse(identifier);
}

// when we send an order we create a promise and store its resolve and reject functions in a map with the identifier as the key, we also set a timeout to reject the promise if we don't get a response within a certain time
private waitForResponse(identifier:string):Promise<OrderResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      this.pendingResponses.delete(identifier);
      reject(new Error("Response timed out"));
    }, 10_000);

    this.pendingResponses.set(identifier, { resolve, reject, timeout});
  })
}


// iam polling the response queue in a loop, when i get a response i check if there is a pending promise for that response and resolve it, if there is no pending promise i just ignore the response
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

// we use the singleton pattern to ensure that there is only one instance of the RedisManager class, this is important because we want to have a single connection to redis and a single loop polling the response queue
  static getInstance():RedisManager{
    if (!RedisManager.instance) {
        RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }
}

export const redisManager = RedisManager.getInstance();


