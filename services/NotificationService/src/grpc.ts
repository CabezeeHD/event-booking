import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { getNotificationById, listNotifications } from "./notification-store";

const PROTO_PATH = path.join(__dirname, "../proto/notificationservice.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
const notificationService = grpcPackage.notificationservice.NotificationService;

function getNotification(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const id = String(call.request.id ?? 0);

  getNotificationById(id)
    .then((notification) => {
      if (!notification) {
        callback({ code: grpc.status.NOT_FOUND, message: "Notification not found" }, null);
        return;
      }
      callback(null, { notification });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

function listNotificationsHandler(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  listNotifications()
    .then((notifications) => callback(null, { notifications }))
    .catch((err) => callback({ code: grpc.status.UNKNOWN, message: err.message }, null));
}

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(notificationService.service, {
    GetNotification: getNotification,
    ListNotifications: listNotificationsHandler
  });
  return server;
}
