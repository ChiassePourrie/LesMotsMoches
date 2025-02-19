<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import apiClient from "./lib/apiClient";
import type { LeaderboardEntry } from "@/types/leaderboard";

const test = ref(0);
const loadingAmount = ref(0);
const loading = computed(() => loadingAmount.value !== 100);
const word = ref<string | null>(null);
const leaderboard = ref<LeaderboardEntry[]>([]);
onMounted(async () => {
  loadingAmount.value = 0;
  const { word: dailyWord } = await apiClient.getRequest<{ word: string }>(
    "/api/daily"
  );
  word.value = dailyWord;
  loadingAmount.value = 50;
  const leaderboardEntries = await apiClient.getRequest<LeaderboardEntry[]>(
    "/api/leaderboard"
  );
  console.log(
    "\x1b[44m%s\x1b[0m",
    "app/App.vue:21 leaderboardEntries",
    leaderboardEntries
  );
  leaderboard.value = leaderboardEntries;
  loadingAmount.value = 100;
});

// Audio

const audio = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const volume = ref(1.0);
const modePro = ref(false);

const togglePlayPause = () => {
  if (audio.value) {
    if (isPlaying.value) {
      audio.value.pause();
    } else {
      audio.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

const changeVolume = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (audio.value) {
    audio.value.volume = parseFloat(target.value);
    volume.value = audio.value.volume;
  }
};
</script>

<template>
  <main>
    <img src="/wordart.png" class="title" alt="" />
    <div class="content">
      <div class="window" v-if="loading" style="width: 300px">
        <div class="title-bar">
          <div class="title-bar-text">Chargement...</div>
        </div>
        <div class="window-body">
          <progress max="100" :value="loadingAmount"></progress>
        </div>
      </div>
      <div class="window" v-else style="width: 300px">
        <div class="title-bar">
          <div class="title-bar-text">Le mot du jour !</div>
        </div>
        <div class="window-body">
          <h2>" {{ word }} "</h2>
          <div class="choices">
            <button>Hideux</button>
            <button>Moche</button>
            <button>OK</button>
            <button>Merveilleux</button>
          </div>
          <p>Tout vote est définitif !!!</p>
        </div>
      </div>
      <div class="window" style="width: 300px">
        <div class="title-bar">
          <div class="title-bar-text">Mots les plus moches du monde</div>
        </div>
        <div class="window-body">
          <ul>
            <li v-for="({ word, total_votes }, i) in leaderboard" :key="word">
              [{{ i + 1 }}] - {{ word }} ({{ total_votes }})
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="mode-pro">
      <button v-if="!modePro" @click="modePro = true">Mode pro</button>
      <div v-else>
        <audio ref="audio" src="/ludicrous_speed.opus"></audio>
        <div class="audio-controls">
          <button @click="togglePlayPause">
            {{ isPlaying ? "Pause" : "Play" }}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model="volume"
            @input="changeVolume"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
body {
  background: url("BRICK10.JPG");
}
main {
  margin: auto;
  width: 100vw;
  max-width: 500px;
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-content: center;
  align-items: center;
  padding: 20px 30px;
  gap: 20px;
}
@keyframes bounce {
  0%,
  100% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1);
  }
}
main > img.title {
  width: 100%;
  animation: bounce 1s ease-in-out infinite;
}
.audio-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mode-pro {
  display: flex;
  justify-content: center;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.window-body {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}
.choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.choices button {
  font-size: 20px;
  width: 100%;
}
</style>
