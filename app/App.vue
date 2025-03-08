<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import apiClient from "./lib/apiClient";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { useStorage } from "@vueuse/core";

const loadingAmount = ref(0);
const loading = computed(() => loadingAmount.value !== 100);
const word = ref<string | null>(null);
const leaderboard = ref<LeaderboardEntry[]>([]);
const id = useStorage<string>("user-id", null);
const originalVote = useStorage<{ word?: string; vote?: number }>(
  "original-vote",
  {}
);

const voiceChoices: [string, number][] = [
  ["Hideux", 2],
  ["Moche", 1],
  ["OK", -1],
  ["Merveilleux", -2],
];

const currentVote = ref<number | null>(null);

watch(currentVote, async (value) => {
  originalVote.value.word = word.value as string;
  originalVote.value.vote = value as number;
  const result = await apiClient.postRequest<{ id: string }>("/api/save", {
    id: id.value,
    category: "general",
    vote: value,
  });
  id.value = result.id;
  const leaderboardEntries = await apiClient.getRequest<LeaderboardEntry[]>(
    "/api/leaderboard"
  );
  leaderboard.value = leaderboardEntries;
});

onMounted(async () => {
  loadingAmount.value = 0;
  const { word: dailyWord } = await apiClient.getRequest<{ word: string }>(
    "/api/daily"
  );
  word.value = dailyWord;
  if (word.value !== originalVote.value.word) {
    originalVote.value = {};
  }
  loadingAmount.value = 50;
  const leaderboardEntries = await apiClient.getRequest<LeaderboardEntry[]>(
    "/api/leaderboard"
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
            <button
              v-for="[text, v] in voiceChoices"
              :disabled="originalVote.vote === v"
              :key="text"
              @click="currentVote = v"
            >
              {{ text }}
            </button>
          </div>
          <p>Tout vote est définitif !!!</p>
        </div>
      </div>
      <div class="window" style="width: 300px">
        <div class="title-bar">
          <div class="title-bar-text">Mots les plus moches du monde</div>
        </div>
        <div class="window-body">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mot</th>
                <th>Score</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="({ word, total_votes, qte_votes }, i) in leaderboard"
                :key="word"
              >
                <td>{{ i + 1 }}</td>
                <td>{{ word }}</td>
                <td>{{ total_votes }}</td>
                <td>{{ qte_votes }}</td>
              </tr>
            </tbody>
          </table>
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
  background: url("brick.jpg");
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

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:hover {
  background-color: #e0e0e0;
}
</style>
