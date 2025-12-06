import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

const SIGNALR_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ||
  "http://localhost:5000/hubs/notifications";

export const createSignalRConnection = (token: string) => {
  if (connection) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const startConnection = async (
  token: string
): Promise<signalR.HubConnection> => {
  const conn = createSignalRConnection(token);

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      // Повторная попытка через 5 секунд
      setTimeout(() => startConnection(token), 5000);
    }
  }

  return conn;
};

export const stopConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
    console.log("SignalR Disconnected");
  }
};

export const getConnection = () => connection;

// Подписка на уведомления
export const subscribeToNotifications = (
  callback: (notification: any) => void
) => {
  if (connection) {
    connection.on("ReceiveNotification", callback);
  }
};

// Подписка на изменение статуса заказа
export const subscribeToOrderStatusChanges = (
  callback: (data: { orderId: number; newStatus: string }) => void
) => {
  if (connection) {
    connection.on("OrderStatusChanged", callback);
  }
};

// Отписка от всех событий
export const unsubscribeAll = () => {
  if (connection) {
    connection.off("ReceiveNotification");
    connection.off("OrderStatusChanged");
  }
};
