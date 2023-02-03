import { Peer } from "peerjs";
import type { DataConnection } from "peerjs";
import type { NetworkingMessage, Table } from "@/types";
import { loadTable } from "./loading";
import { createStack, moveCard } from "./stack";
import type { Ref } from "vue";

export const handleNetworkingMessage = (
  message: NetworkingMessage,
  table: Ref<Table | undefined>
) => {
  const { cmd, data } = message;

  switch (cmd) {
    case "set-table":
      table.value = {
        ...data,
        localScreen: table.value ? table.value.localScreen : data.localScreen,
      };
      break;
    case "move-card":
      if (table.value)
        moveCard(
          data[0],
          data[1],
          table.value,
          data[2],
          table.value.localScreen == 0
        );
      break;
    case "reload-screen":
      if (table.value) {
        setTimeout(
          () => window.location.reload(),
          1000 * table.value.localScreen
        );
      }
      break;
    case "point-to-screen":
      if (table.value) {
        table.value.pointToScreen = data;
        setTimeout(() => {
          if (table.value && table.value.pointToScreen == data)
            table.value.pointToScreen = 0;
        }, 2000);
      }
      break;
    default:
      break;
  }
};

export const setupNetwork = async (
  table: Ref<Table | undefined>,
  room?: string,
  tableSource?: string
) => {
  if (!room && tableSource) {
    room = localStorage.getItem("last-room-id") || undefined;
    table.value = await loadTable(tableSource);
    let peer = room ? new Peer(room) : new Peer();

    const connections: DataConnection[] = [];

    const sendNetworkingMessage = (
      message: NetworkingMessage,
      skip: number[] = []
    ) =>
      connections.forEach((conn, index) => {
        const screen = index + 1;
        if (table.value && !skip.includes(screen))
          conn.send({ ...message, sender: table.value.localScreen });
      });

    table.value.sendNetworkingMessage = sendNetworkingMessage;

    peer.on("error", () => {
      if (!peer.open) peer = new Peer();
    });

    peer.on("open", () => {
      room = peer.id;
      localStorage.setItem("last-room-id", room);
      console.log(
        "Game URL: ",
        window.location.href + "?room=" + encodeURIComponent(room || "")
      );
    });

    peer.on("connection", (conn) => {
      if (!table.value || !table.value.open) {
        setTimeout(() => conn.close(), 500);
        return;
      }
      const remoteScreen = table.value.screenAmount;
      createStack(
        {
          screen: remoteScreen,
          style: "side-by-side",
          flipped: false,
          defaultStack: true,
          taking: "one",
          autoArrange: true,
        },
        table.value
      );
      table.value.screenAmount++;
      connections.push(conn);

      conn.on("data", (message) => {
        const { sender } = message as NetworkingMessage;
        handleNetworkingMessage(message as NetworkingMessage, table);
        // Broadcast message to other screens
        sendNetworkingMessage(message as NetworkingMessage, [sender || 0]);
      });

      conn.on("open", () => {
        console.log("New screen connected!");
        sendNetworkingMessage({
          cmd: "set-table",
          data: {
            ...table.value,
            localScreen: remoteScreen,
            sendNetworkingMessage: undefined,
          } as Table,
        });
      });
    });
  } else if (room) {
    const peer = new Peer();
    await new Promise((resolve) => peer.on("open", resolve));

    const conn = peer.connect(room);

    conn.on("open", () => console.log("Connected to game!"));
    conn.on("data", (incomingMessage: any) => {
      if (incomingMessage.cmd == "set-table") {
        incomingMessage.data.sendNetworkingMessage = (
          message: NetworkingMessage
        ) =>
          conn.send({ ...message, sender: incomingMessage.data.localScreen });
      }
      handleNetworkingMessage(incomingMessage as NetworkingMessage, table);
    });
  }
};
