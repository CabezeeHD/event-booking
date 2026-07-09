import * as amqp from "amqplib";

type AmqpConnection = any;
type AmqpChannel = any;
type AmqpMessage = any;

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;

export async function connectRabbit(url: string): Promise<AmqpChannel> {
  if (channel) {
    return channel;
  }

  connection = await (amqp as any).connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange("events", "topic", { durable: true });
  console.log(`Connected to RabbitMQ at ${url}`);
  return channel as AmqpChannel;
}

export async function publishEvent(routingKey: string, payload: object): Promise<void> {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  channel.publish("events", routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true
  });
}

export async function consumeQueue(queue: string, routingKeys: string[], handler: (msg: any) => Promise<void>): Promise<void> {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  await channel.assertQueue(queue, { durable: true });
  for (const key of routingKeys) {
    await channel.bindQueue(queue, "events", key);
  }
  await channel.consume(queue, async (message: AmqpMessage | null) => {
    if (!message) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString());
      await handler(payload);
      channel!.ack(message);
    } catch (err) {
      console.error("RabbitMQ handler error:", err);
      channel!.nack(message, false, true); // Requeue the message for retry
    }
  });
}

export async function closeRabbit(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}
