<script setup lang="ts">
import { ref } from "vue";
import type { Table } from "./types";
import CardComponent from "./components/CardComponent.vue";
import { setupNetwork } from "./utils/networking";
import { screenScale, screenAngle } from "./utils/screen";
import * as QRCode from "qrcode";

const table = ref<Table | undefined>();
const roomQrCode = ref<string | undefined>();
const isFullScreen = ref<boolean>(false);

const games = ["tables/uno/table.json", "tables/standard-52-cards/table.json"];
let currentGameIndex = games.indexOf(
  decodeURIComponent((window.location.search.match("game=([^&]+)") || [])[1])
);
console.log(currentGameIndex);
const providedRoom = (window.location.search.match("room=([^&]+)") || [])[1];

const openFullscreen = () => {
  var elem = document.documentElement as any;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
  setTimeout(() => screen.orientation.lock("landscape"), 500);
};

const setupGame = async () => {
  if (!providedRoom && currentGameIndex == -1)
    window.location.search = "?game=" + encodeURIComponent(games[0]);
  else await setupNetwork(table, providedRoom, games[currentGameIndex]);
};

const pointToLocalScreen = () => {
  if (!table.value?.sendNetworkingMessage) return;
  table.value.sendNetworkingMessage({
    cmd: "point-to-screen",
    data: table.value.localScreen,
  });
};

const reloadRemoteScreens = () => {
  if (!table.value?.sendNetworkingMessage) return;
  table.value.sendNetworkingMessage({
    cmd: "reload-screen",
    data: null,
  });
};

const reload = () => {
  reloadRemoteScreens();
  setTimeout(() => window.location.reload());
};
const next = () => {
  if (currentGameIndex == -1) currentGameIndex = 0;
  currentGameIndex = (currentGameIndex + 1) % games.length;
  reloadRemoteScreens();

  window.location.search =
    "?game=" + encodeURIComponent(games[currentGameIndex]);
};
const share = async () => {
  const room = localStorage.getItem("last-room-id");
  if (!room) return;
  const inviteUrl =
    window.location.href.replace(/\?.+$/, "") +
    "?room=" +
    encodeURIComponent(room);
  roomQrCode.value = await QRCode.toDataURL(inviteUrl);
};

const changeScale = (amount: number) => {
  if (!table.value) return;
  if (table.value.localScreen == 0)
    table.value.mainScale = (table.value.mainScale || 0) + amount * 0.1;
  else table.value.handScale = (table.value.handScale || 0) + amount * 0.1;
};

setupGame();
window.addEventListener("click", () => {
  openFullscreen();
});
window.addEventListener("fullscreenchange", (event) => {
  isFullScreen.value = !!document.fullscreenElement;
});
</script>

<template>
  <div
    v-if="table"
    class="table prevent-select"
    :style="{
      'background-image': `url(${table.background})`,
    }"
  >
    <template v-if="isFullScreen">
      <div class="title">AirDeck</div>
      <div class="zoom-control">
        <div @click="changeScale(1)">+</div>
        <div @click="changeScale(-1)">-</div>
      </div>
      <div
        v-if="table.localScreen"
        class="screen-hint"
        @click="pointToLocalScreen"
      >
        {{ table.localScreen }}
      </div>
      <template v-else>
        <div
          v-if="roomQrCode"
          class="room-qrcode"
          @click="roomQrCode = undefined"
        >
          <img :src="roomQrCode" />
          <br />
          Close
        </div>
        <div class="reload-btn" @click="reload">Reload</div>
        <div class="next-game-btn" @click="next">Next Game</div>
        <div class="share-btn" @click="share">Invite</div>
        <div
          :style="{
            opacity: table.pointToScreen ? 1 : 0,
            transform: `translate(-50%, -50%) rotate(${
              screenAngle(table.pointToScreen || 0, table) - 90
            }deg)`,
          }"
          class="screen-pointer"
        >
          A
        </div>
      </template>
    </template>
    <div v-else class="watermark">
      <div>AirDeck<br /><span>Tap the Screen</span></div>
    </div>
    <div
      class="card-wrapper"
      :style="{
        transform: `translate(-50%, -50%) scale(${screenScale(table).toFixed(
          2
        )})`,
      }"
    >
      <CardComponent
        v-for="card of table.cards"
        :card="card"
        :table="table"
        :key="card.id"
      ></CardComponent>
    </div>
  </div>
</template>

<style scoped>
.title {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 20px;
  font-size: 3vh;
  color: white;
  padding: 10px;
  background-color: rgba(0, 132, 255, 0.7);
  box-shadow: 1px 1px 10px black;
}
.screen-pointer {
  pointer-events: none;
  z-index: 99999999999999999;
  position: fixed;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 10px;
  font-size: 8rem;
  border-radius: 50px;
  color: white;
  padding: 10px;
  text-shadow: 1px 1px 10px black;
  transition: opacity 0.5s, transform 1s;
}

.room-qrcode {
  z-index: 99999999999999999;
  position: fixed;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 1px 1px 10px black;
  background-color: rgba(0, 132, 255, 0.7);
}
.room-qrcode img {
  max-height: 80%;
}

.reload-btn,
.next-game-btn,
.share-btn,
.zoom-control {
  z-index: 99999999999999999;
  position: fixed;
  line-height: 5vh;
  font-size: 5vh;
  color: white;
  opacity: 0.8;
}

.reload-btn {
  top: 20px;
  left: 20px;
}

.next-game-btn {
  top: 20px;
  right: 20px;
}
.share-btn {
  bottom: 20px;
  right: 20px;
}
.zoom-control {
  bottom: 20px;
  left: 20px;
  font-size: 10vh;
}
.zoom-control div {
  display: inline-block;
  margin-left: 20px;
}

.screen-hint {
  z-index: 0;
  position: fixed;
  bottom: 10px;
  right: 10px;
  line-height: 38vh;
  font-size: 40vh;
  color: white;
  opacity: 0.2;
}
.table {
  position: fixed;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  background-size: cover;
  background-position: center;
}
.table .card-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
}
</style>
