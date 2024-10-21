async function fetchSongs() {
  console.log('here');
  const res = await fetch('/songs');
  console.log(res);
}

fetchSongs();