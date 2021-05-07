const playerElement = document.getElementById('player-wrapper')
const thumbs = [];
for (let i=0; i<104; i++) {
  thumbs.push({
    url: 'https://tjenkinson.me/clappr-thumbnails-plugin/assets/thumbnails/thumb_'+(i+1)+'.jpg',
    time: 1 + (i*2)
  });
}
const player = new Clappr.Player({
  source: 'https://tjenkinson.me/clappr-thumbnails-plugin/assets/video.mp4',
  plugins: [window.ScrubThumbnailsPlugin],
  scrubThumbnails: {
    backdropHeight: 64, // set to 0 or null to disable backdrop
    spotlightHeight: 84, // set to 0 or null to disable spotlight
    backdropMinOpacity: 0.4, // optional
    backdropMaxOpacity: 1, // optional
    thumbs: thumbs
  }
})

player.attachTo(playerElement)
