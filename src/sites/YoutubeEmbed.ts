import { RepeatMode, Site, StateMode } from '../content'
import { querySelector, querySelectorEventReport, querySelectorReport, timeInSecondsToString } from '../utils'

let shuffleState = false
let playlistLoaded = false
let currentCoverUrl = ''
let lastCoverVideoId = ''

const site: Site = {
  ready: () =>
    querySelector<boolean, HTMLElement>('.ytp-title-text', (el) => el.innerText.length > 0, false)
    && querySelector<boolean, HTMLVideoElement>('.html5-video-player', (el) => !el.classList.contains('unstarted-mode'), false),
  info: {
    player: () => 'Youtube Embed',
    state: () => {
      let state = querySelectorReport<StateMode, HTMLVideoElement>('.html5-main-video', (el) => (el.paused ? StateMode.PAUSED : StateMode.PLAYING), StateMode.PAUSED, 'state')
      // It is possible for the video to be "playing" but not started
      if (state === StateMode.PLAYING && querySelector<boolean, HTMLVideoElement>('.html5-main-video', (el) => el.played.length <= 0, false))
        state = StateMode.PAUSED
      return state
    },
    title: () => querySelectorReport<string, HTMLElement>('.ytp-title-text', (el) => el.innerText, '', 'title'),
    // Not reporting artist, as it seems to sometimes return a empty string as innerText when the artist hasn't loaded yet.
    artist: () => querySelector<string, HTMLElement>('.ytp-title-expanded-title', (el) => el.innerText, ''),
    album: () => querySelector<string, HTMLElement>('.ytp-playlist-menu-title', (el) => el.innerText, ''),
    cover: () => {
      const videoId = new URLSearchParams(document.querySelector<HTMLAnchorElement>('.ytp-title-link')?.search).get('v')

      if (videoId && lastCoverVideoId !== videoId) {
        lastCoverVideoId = videoId
        const img = document.createElement('img')
        img.setAttribute('src', `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
        img.addEventListener('load', () => {
          if (img.height > 90)
            currentCoverUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
          else
            currentCoverUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        })
        img.addEventListener('error', () => {
          currentCoverUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        })
      }

      return currentCoverUrl
    },
    duration: () => querySelectorReport<string, HTMLVideoElement>('.html5-main-video', (el) => timeInSecondsToString(el.duration), '0:00', 'duration'),
    position: () => querySelectorReport<string, HTMLVideoElement>('.html5-main-video', (el) => timeInSecondsToString(el.currentTime), '0:00', 'position'),
    volume: () => querySelectorReport<number, HTMLVideoElement>('.html5-main-video', (el) => (el.muted ? 0 : el.volume * 100), 0, 'volume'),
    rating: () => 0,
    repeat: () => querySelectorReport<RepeatMode, HTMLVideoElement>('.html5-main-video', (el) => (el.loop ? RepeatMode.ONE : RepeatMode.NONE), RepeatMode.NONE, 'repeat'),
    shuffle: () => shuffleState
  },
  events: {
    togglePlaying: () => querySelectorEventReport<HTMLButtonElement>('.ytp-play-button', (el) => el.click(), 'togglePlaying'),
    next: () => {
      // Not using reporting querySelectors right now
      const list = new URLSearchParams(document.querySelector<HTMLAnchorElement>('.ytp-title-link')?.search).get('list')
      if (shuffleState && list) {
        const playlist = document.querySelector('.ytp-playlist-menu-items')
        // Open the playlist menu and close it again to load the children
        if (!playlistLoaded && playlist?.children.length === 0) {
          const openButton = document.querySelector<HTMLButtonElement>('.ytp-playlist-menu-button')
          openButton?.click()
          openButton?.click()
          playlistLoaded = true
        }
        (playlist?.children[
          Math.floor(Math.random() * playlist?.children.length)
        ] as HTMLButtonElement).click()
      } else {
        const nextButton = document.querySelector<HTMLButtonElement>('.ytp-next-button')
        if (nextButton?.getAttribute('aria-disabled') !== 'true') nextButton?.click()
      }
    },
    previous: () => {
      // Not using reporting querySelectors right now
      const video = document.querySelector<HTMLVideoElement>('.html5-main-video')
      if (!video) return
      const previousButton = document.querySelector<HTMLButtonElement>('.ytp-prev-button')
      const list = new URLSearchParams(document.querySelector<HTMLAnchorElement>('.ytp-title-link')?.search).get('list')
      if (shuffleState && list) {
        if (video.currentTime <= 3) {
          const playlist = document.querySelector('.ytp-playlist-menu-items')
          // Open the playlist menu and close it again to load the children
          if (!playlistLoaded && playlist?.children.length === 0) {
            const openButton = document.querySelector<HTMLButtonElement>('.ytp-playlist-menu-button')
            openButton?.click()
            openButton?.click()
            playlistLoaded = true
          }
          (playlist?.children[
            Math.floor(Math.random() * playlist?.children.length)
          ] as HTMLButtonElement).click()
        } else {
          video.currentTime = 0
        }
      } else if (previousButton?.getAttribute('aria-disabled') !== 'true' && video.currentTime <= 3) {
        previousButton?.click()
      } else {
        video.currentTime = 0
      }
    },
    setPositionSeconds: (positionInSeconds: number) => querySelectorEventReport<HTMLVideoElement>('.html5-main-video', (el) => el.currentTime = positionInSeconds, 'setPositionSeconds'),
    setPositionPercentage: null,
    setVolume: (volume: number) => {
      querySelectorEventReport<HTMLVideoElement>('.html5-main-video', (el) => {
        el.volume = volume / 100
        if (volume === 0) el.muted = true
        else el.muted = false
      }, 'setVolume')
    },
    toggleRepeat: () => querySelectorEventReport<HTMLVideoElement>('.html5-main-video', (el) => el.loop = !el.loop, 'toggleRepeat'),
    toggleShuffle: () => {
      // Not using reporting querySelectors right now
      const list = new URLSearchParams(document.querySelector<HTMLAnchorElement>('.ytp-title-link')?.search).get('list')
      if (list) shuffleState = !shuffleState
      else shuffleState = false
    },
    toggleThumbsUp: null,
    toggleThumbsDown: null,
    setRating: null
  }
}

export default site