<script>
    import { onMount } from 'svelte';
  
    let rivers = [];
  
    onMount(async () => {
      try {
        const response = await fetch('/api/rivers');
        if (!response.ok) {
          throw new Error('Failed to fetch rivers');
        }
        rivers = await response.json(); 
      } catch (error) {
        console.error(error);
      }
    });
  </script>
  
  <h2>Rivers List:</h2>
  <ul>
    {#each rivers as river}
      <li>
        <a href={`/api/rivers/${river.id}`} target="_blank">{river.name}</a>
      </li>
    {/each}
  </ul>
  