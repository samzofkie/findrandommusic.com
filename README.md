### findrandommusic.com
Technically the only fair way to listen to music.

### Frontend
![A diagram of the hierarchy of React components for the project.](/doc/components_diagram.png)

Most of the important data is held in state or in refs in the `<App/>` component:
- The `songs` state variable is an array of song objects, transmitted from the `/songs` endpoint on the API.
- The `filterParams` ref holds an object that is modified by the controls in the `<Controls/>` component, including a session `nanoid()` that is set upon initialization.
-  The `errorMessage` state variable displays error messages from the server/API transmitted in the body of HTTP 500 responses.
-  The `currentlyPlayingSong` state variable is set to the unique, string `.id` property of the song object that should be playing out loud at any given time.
-  The `autoPlayOn` state variable is toggled in the `<Controls/>` component, and read by `<Song/>` components to know whether or not to call `playNextSong()` when the playback of it's `<AudioPlayer/>` has ended.
-  The `controlsExpanded` state variable is toggled by `<Controls/>`, used to calculate the CSS `grid-template-columns` property of the main `.app` `<div>`, and passed to `<Controls/>` for the conditional rendering of the main `<FilterMenu/> ` component
   - It was important for this value to be kept all the way in `<App/>` so that the `grid` CSS properties could be set programmatically by `<App/>`, which seemed like the easiest way to be able to have the `<SongList/>` component be nicely, dynamically resized to be side by side with the `<FilterMenu/>` component.

The rest of the app is naturally divided into two main branches; `<SongList/>` and `<Controls/>`.

#### `<SongList/>`

`<SongWidth/>` manages the ordering and layout of the songs very closely, using CSS `absolute` positioning, whenever the window is resized, zoomed in or out, or the `<FilterMenu/>` sidebar is opened or closed. Children `<Song/>`s render, report their final `<div>` height to `<SongList/>` via `reportHeight()` (passed as a prop, called by a `ResizeObserver` setup with `useCallback()`), and then `<SongList/>` updates it's `songHeights` state variable accordingly, causing the component to re-render, calculating the new layout and telling each `<Song/>` where to be via a `coord` tuple passed to `<Song/>` as a prop. 

All this ultimately implements a layout very close to CSS `flex` with `row wrap`, but ordering the songs from the top down across columns. The current implementation has a nice property which is that the songs are always in order by height, so `playNextSong()` for the auto play functionality can always just play the subsequent song in the `songs` array in `<App/>`, and it will be the next highest `<Song/>` displayed. Doing it this way also allows for easy, beautiful animation of the `<Songs/>` movement using CSS `transition`.

Besides reporting it's height to `<SongList/>`, the main work of `<Song/>` is simply to hold the state to coordinate flashing the `previewDisabledMessage` between `<SongArtwork/>` and `<AudioPlayer/>` if audio playback is unsupported. `<AudioPlayer/>` pulls auto play stuff (like `playNextSong()`) from the `PlaybackContext` and registers a handler to the HTML audio element's `onEnded` event. `<SongInfo/>`, `<SongInfoLink/>`, and `<IconLine/>` and basically just abstractions of basic `<div>` CSS combinations. `<PopularityBar/>` is just some HTML `<hr>`s.

#### `<Controls/>`

`<Controls/>` recieves a boolean prop `isMobile` that it uses to assign CSS properties so the navbar is on the bottom of the screen for mobile and on the side for desktop. `<PauseButton/>` grabs `pausePlayback()` from `PlaybackContext`. `<FilterMenu/>` conditionally renders `<AutoPlayToggle/>`, `<DateRange/>`, `<FilterRange/>`, and `<GenreList/>`, as well as an X icon to close the controls, depending on the state of it's `expanded` prop. `<AutoPlayToggle/>` uses `toggleAutoPlay` and an abstracted `<ToggleSwitch/>` helper component. 

`<DateRange/>` and `<PopularityRange/>` both are wrappers around an abstracted `<FilterRange/>` component, which uses `FilterContext` to set the `filterParams` ref from `<App/>`, and set some common parameters for `<MultiRangeSlider/>`, which is imported from NPM. `<GenreList/>` also uses the `FilterContext` to set the `filterParams` ref, and maps a `fetch`ed JSON `genre-list` object to buttons, whose state is recorded in a state variable `selectedGenres`, and whose changes are reflected in the `<App/>` level `filterParams` via `setFilterParams`.

#### `<App/>` functions

`checkIfMoreSongsNeeded()` is registered to `window.onresize` in a `useEffect`, and calls `fetchSongs()` if the user has scrolled down the page to a certain ratio.

`fetchSongs()` is very much the heart of `<App/>`-- a parameter-less function for replenishing the `songs` state with more songs fetched from the server. It creates a query string reflecting the current state of the `filterParams` ref to convey the search parameters to the backend crawler with a helper function, `buildQueryString()`. It also sets the `errorMessage` state variable with the body of the response if the status code is 500, conveying (currently only) the timeout message to the user, and triggering a re-render of `<App/>` that displays it.

The other heart of the logic of the entire frontend is the `setFilterParams()` function, which is passed via context to children of `<FilterMenu/>`. It is only called when the user has changed the underlying HTML elements corresponding to the `filterParams`, so it
1. sets the new `filterParams`,
2. sets `errorMessage` to `""`, so the `<Loader/>` comes back, indicating to the user that the backend has started looking for songs for them,
3. calls `clearSongs()`, since the current contents of `songs` no longer reflects the filter settings, since they have definitely just changed, and
4. calls `fetchSongs()`, sending the new `filterParams` to the backend via query string.
Outside of an initial call to `fetchSongs()` after the initial render of `<App/>`, and the event handler `checkIfMoreSongsNeeded`, `setFilterParams()` is the main caller of `fetchSongs()`.

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

### Future Work
- TDD rewrite
- TLA+ verification of the backend
- Use proper distributed locking of the Redis cache to avoid the posibility of incorrect responses from the server
- Frontend stuff
  - Tooltips
  - `<GenreList/>`
    - Selected genres float to top  
    - Search bar
    - Memoization / pagination to reduce bundle size
  - Optimize bundle size
  - Scroll to keep place in `<SongList/>` on resizing
  - Use React reducer for `<App/>`
- Have crawler pick results more evenly from all posible search results, making more requests to Spotify's `/search` endpoint
- Train ML models to learn user preferences based on selected songs (recommender system)
  - Determine if this violates the developer agreement 
- Feature ideas
  - Create a playlist and add songs by double clicking them
  - Options of what song information to display (i.e. only show artwork, show nothing and only offer audio playback, ect)
  - Song playback plays the whole 30 second preview-- a control to change it (play each song for only 5 seconds before moving on)
  - Option to filter out all songs not supporting audio playback
- More research into Nginx security
- Replace Docker compose with Kubernetes
  - Configure an autoscaling setup with a cloud provider
  - Have a hybrid self-hosted / cloud cluster
