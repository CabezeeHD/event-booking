import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.join(__dirname, "../proto/eventservice.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;

const eventServiceClient = new grpcPackage.eventservice.EventService(
  process.env.EVENT_SERVICE_GRPC_URL ?? "localhost:50051",
  grpc.credentials.createInsecure()
);

const TRANSIENT_CODES = new Set([
  grpc.status.UNAVAILABLE,
  grpc.status.DEADLINE_EXCEEDED,
  grpc.status.INTERNAL,
  grpc.status.RESOURCE_EXHAUSTED,
]);

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 200): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient = err?.code !== undefined && TRANSIENT_CODES.has(err.code);
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export function reserveCapacity(eventId: string, seats: number): Promise<{success: boolean; capacity: number}> {
  return new Promise((resolve, reject) => {
    eventServiceClient.ReserveCapacity(
      {
        eventId,
        seats
      },
      (error: grpc.ServiceError | null, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({success: response.success, capacity: response.remaining_capacity});
      }
    );
  });
}

export function releaseCapacity(eventId: string, seats: number): Promise<{success: boolean}> {
  return new Promise((resolve, reject) => {
    eventServiceClient.ReleaseCapacity(
      {eventId, seats},
      (error: grpc.ServiceError | null, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({success: response.success});
      }
    );
  });
}