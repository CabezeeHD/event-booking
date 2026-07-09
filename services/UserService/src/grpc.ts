import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { getUserById, listUsers } from "./user-store";

const PROTO_PATH = path.join(__dirname, "../proto/userservice.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcPackage = grpc.loadPackageDefinition(packageDefinition) as any;
const userService = grpcPackage.userservice.UserService;

function getUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  const id = String(call.request.id ?? 0);

  getUserById(id)
    .then((user) => {
      if (!user) {
        callback({ code: grpc.status.NOT_FOUND, message: "User not found" }, null);
        return;
      }
      callback(null, { user });
    })
    .catch((err) => {
      callback({ code: grpc.status.UNKNOWN, message: err.message }, null);
    });
}

function listUsersHandler(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
  listUsers()
    .then((users) => callback(null, { users }))
    .catch((err) => callback({ code: grpc.status.UNKNOWN, message: err.message }, null));
}

export function createGrpcServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(userService.service, {
    GetUser: getUser,
    ListUsers: listUsersHandler
  });
  return server;
}
