import React from 'react'
import ReactDOM from 'react-dom'
import './reset.css'
import './index.css'
import PlaySongPage from './PlaySongPage'
import SelectSong from './SelectSongPage'
import * as serviceWorker from './serviceWorker'
import { PlayerProvider, SongPressedKeysProvider, UserPressedKeysProvider } from './hooks/index'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { StaffPage } from './StaffPage'

function Root() {
  return (
    <React.StrictMode>
      <UserPressedKeysProvider>
        <SongPressedKeysProvider>
          <PlayerProvider>
            <Router>
              <Route path="/" exact component={SelectSong} />
              <Route path="/learn/lessons" exact component={SelectSong} />
              <Route path="/play/music/:song_location" component={PlaySongPage} />
              <Route path="/staff" component={StaffPage} />
            </Router>
          </PlayerProvider>
        </SongPressedKeysProvider>
      </UserPressedKeysProvider>
    </React.StrictMode>
  )
}

ReactDOM.render(<Root />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
