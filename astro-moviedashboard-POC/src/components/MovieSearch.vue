<template>
  <div>
    <label class="block mb-2 font-medium">Buscar películas / series</label>
    <div class="flex gap-2">
      <input v-model="term" @keyup.enter="doSearch" class="flex-1 border rounded px-3 py-2" placeholder="Ej: The Matrix" />
      <button @click="doSearch" class="px-4 py-2 rounded bg-sky-600 text-white">Buscar</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MovieSearch',
  setup() {
    const term = ref('');

    const doSearch = async () => {
      if (!term.value) return;
      const q = new URLSearchParams({ query: term.value, page: '1' });
      // fetch al endpoint proxy /api/tmdb (si lo tenés) O al endpoint público (evita exponer key)
      // preferible: usar /api/tmdb?path=search/movie&query=...
      const res = await fetch(`/api/tmdb?path=search/movie&query=${q}`);
      const json = await res.json();
      window.dispatchEvent(new CustomEvent('results', { detail: json.results || [] }));
    };

    return { term, doSearch };
  }
});
</script>
