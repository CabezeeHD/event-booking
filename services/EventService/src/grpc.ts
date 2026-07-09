import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { getEventById, listEvents, releaseEventCapacity, reserveEventCapacity } from "./event-store";

const PROTO_PATH = path.join(__dirname, "../proto/eventservice.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
const eventService = grpcPackage.eventservice.EventService;

function getEvent(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const id = String(call.request.id ?? 0);

  getEventById(id)
    .then((event) => {
      if (!event) {
        callback({ code: grpc.status.NOT_FOUND, message: "Event not found" }, null);
        return;
      }
      callback(null, { event });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

function listEventsHandler(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  listEvents()
    .then((events) => callback(null, { events }))
    .catch((err) => callback({ code: grpc.status.UNKNOWN, message: err.message }, null));
}

function reserveCapacityHandler(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const { eventId, seats } = call.request;
  reserveEventCapacity(String(eventId), Number(seats))
    .then((result) => {
      if (!result) {
        callback({ code: grpc.status.NOT_FOUND, message: "Event not found or insufficient capacity" }, null);
        return;
      }
      callback(null, { 
        success: result.success, 
        remainingCapacity: result.remaining_capacity, 
        message: result.success ? "Reservation successful" : "Insufficient capacity" });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

export async function releaseCapacityHandler(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const { eventId, seats } = call.request;
  const result = await releaseEventCapacity(String(eventId), Number(seats));
  if (!result) {
    callback({ code: grpc.status.NOT_FOUND, message: "Event not found" }, null);
    return;
  }
  callback(null, { 
    success: result.success, 
    remainingCapacity: result.remaining_capacity, 
    message: result.success ? "Capacity released successfully" : "Failed to release capacity" });
}

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(eventService.service, {
    GetEvent: getEvent,
    ListEvents: listEventsHandler,
    ReserveCapacity: reserveCapacityHandler,
    ReleaseCapacity: releaseCapacityHandler
  });
  return server;
}
