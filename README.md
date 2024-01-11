### findrandommusic.com

### Frontend
It's in React!
![A diagram of the hierarchy of React components for the project.](/doc/components_diagram.png)

### Backend
There are 3 main containers that comprise the backend:
- `api` express.js api,
- `crawler` node.js script that hits the Spotify Web API, and
- `redis` cache that has a
  - *songs* set that holds random songs (chosen without any filtering), a
  - *users* hash that maps a user's nanoid to a stringified JSON object describing their filter parameters, and
  - sets named after users' IDs, holding collected songs that meet their current filter parameters.

The `nginx` reverse proxy container serves `index.html` and `index.bundle.js`, and routes `GET`s for `/genre-list` and `/songs` to the `api`.

For `/genre-list`, `api` returns an array of strings representing each possible genre, to be displayed in the frontend.

For `/songs`, `api` checks to see if the query string includes any of
- `dateStart`
- `dateEnd`
- `popularityStart`
- `popularityEnd`
- `genres`.

If it doesn't, it will just pop 10 songs from the *songs* `redis` set and call it a day-- otherwise, it:
1. Sends a `HTTPS 406` if the query string in the request doesn't include an ID value.
2. Checks if the supplied ID maps to a stringified filter parameter object in the `redis` *users* hash.
   + If it isn't in the hash (i.e. this user has never been seen before), it will just add it's parameters to the *users* hash and move on.
   + If it **is** in the hash, it checks to see if that ID's filter parameters are different that the one from the current request. If they're the same it will just move on, but if they **are** different it
     - sets ID in the *users* hash to be equal to the new settings, and
     - deletes the set whose name is the ID (chucks all the songs that have been found under different filter settings, as those aren't appropriate any more).
3. Then we just wait in an infinite loop, constantly checking how many songs are in the `redis` set for that user ID, until there are at least 10, and then we pop and send 'em.

That's it!

So the `crawler`'s only way of communicating with the `api` container is via the *users* hash in the `redis` store. So the `crawler`'s work is to
1. Grab the current user settings from the *users* hash.
2. Make requests to the Spotify Web API on behalf of each user, incorporating their filter parameters into it's requests.
3. Push the found songs to each users' `redis` set, for the `api` to relay to the end users.

