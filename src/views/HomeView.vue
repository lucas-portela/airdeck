<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import Peer, { DataConnection } from "peerjs";

const connection = new RTCPeerConnection();
let channel: RTCDataChannel | null = null;

connection.ondatachannel = (evt) => {
  console.log("Data channel created!");
  channel = evt.channel;
  channel.onmessage = (evt) => alert("Message from A: " + evt.data);
};

connection.onconnectionstatechange = () =>
  console.log("Connection state change: ", connection.connectionState);

connection.oniceconnectionstatechange = () =>
  console.log("Connection ICE state change: ", connection.iceConnectionState);

const createOffer = async () => {
  channel = connection.createDataChannel("data");
  channel.onmessage = (evt) => alert("Message from B: " + evt.data);

  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  setTimeout(
    () => prompt("Offer:", JSON.stringify(connection.localDescription)),
    1000
  );
};

const acceptOffer = async () => {
  const offer = JSON.parse(prompt("Offer:") || "");
  await connection.setRemoteDescription(offer);

  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  setTimeout(
    () => prompt("Answer:", JSON.stringify(connection.localDescription)),
    1000
  );
};

const acceptAnswer = async () => {
  const answer = JSON.parse(prompt("Answer:") || "");
  await connection.setRemoteDescription(answer);
};

const sendData = () => {
  channel?.send(prompt("Send Data:") || "empty");
};

var peer: Peer | null = null;
var conn: DataConnection | null = null;

const id = "lobinho-host-12346";
const host = () => {
  peer = new Peer(id);
  peer.on("open", () => {
    console.log("peerjs open");
  });
  peer.on("connection", function (cn) {
    cn.on("data", function (data) {
      alert(data);
    });
  });
};
const connect = () => {
  peer = peer || new Peer();
  conn = peer.connect(id);
  conn.on("open", function () {
    console.log("opened");
  });
};
const send = () => {
  conn?.send(prompt("Send Data:") || "empty");
};
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <button @click="createOffer">Create Offer</button>
      <button @click="acceptOffer">Accept Offer</button>
      <button @click="acceptAnswer">Accept Answer</button>
      <button @click="sendData">Send Data</button>
      <button @click="host">Host PeersJS</button>
      <button @click="connect">Connect PeersJS</button>
      <button @click="send">Send Data PeersJS</button>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
