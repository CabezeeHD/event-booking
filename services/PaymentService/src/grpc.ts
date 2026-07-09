import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { getPaymentById, listPayments } from "./payment-store";

const PROTO_PATH = path.join(__dirname, "../proto/paymentservice.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
const paymentService = grpcPackage.paymentservice.PaymentService;

function getPayment(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const id = String(call.request.id ?? 0);

  getPaymentById(id)
    .then((payment) => {
      if (!payment) {
        callback({ code: grpc.status.NOT_FOUND, message: "Payment not found" }, null);
        return;
      }
      callback(null, { payment });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

function listPaymentsHandler(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  listPayments()
    .then((payments) => callback(null, { payments }))
    .catch((err) => callback({ code: grpc.status.UNKNOWN, message: err.message }, null));
}

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(paymentService.service, {
    GetPayment: getPayment,
    ListPayments: listPaymentsHandler
  });
  return server;
}
