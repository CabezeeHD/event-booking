import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { getBookingById, listBookings } from "./booking-store";

const PROTO_PATH = path.join(__dirname, "../proto/bookingservice.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
const bookingService = grpcPackage.bookingservice.BookingService;

function getBooking(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const id = String(call.request.id ?? "");

  if (!id || id === "0") {
    callback({ code: grpc.status.INVALID_ARGUMENT, message: "Booking ID is required" }, null);
    return;
  }
  
  getBookingById(id)
    .then((booking) => {
      if (!booking) {
        callback({ code: grpc.status.NOT_FOUND, message: "Booking not found" }, null);
        return;
      }
      callback(null, { booking });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

function listBookingsHandler(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  listBookings()
    .then((bookings) => callback(null, { bookings }))
    .catch((err) => callback({ code: grpc.status.UNKNOWN, message: err.message }, null));
}

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(bookingService.service, {
    GetBooking: getBooking,
    ListBookings: listBookingsHandler
  });
  return server;
}
