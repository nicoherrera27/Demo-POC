<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  export let movies: any[] = [];
  let canvas: HTMLCanvasElement;

  onMount(() => {
    const grouped: Record<string, number[]> = {};

    // Agrupar películas por año
    movies.forEach((m) => {
      const year = m.release_date ? m.release_date.substring(0, 4) : 'N/A';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(m.vote_average || 0);
    });

    // Preparar datos para el gráfico
    const labels = Object.keys(grouped).sort();
    const data = labels.map((y) => {
      const arr = grouped[y];
      return arr.length 
        ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 
        : 0;
    });

    // Crear el gráfico
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio rating',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  });
</script>

<canvas bind:this={canvas}></canvas>
