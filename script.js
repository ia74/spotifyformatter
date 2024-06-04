let spotifyFormatter = {
	version: '1.0.0',
	newClasses: {
		lyricContainerUnsupported: 'sf-lcu'
	},
	proxy: 'http://localhost:8080/',
	desktop: window.location.href.includes('xpui.app'),
	finds: {
		mainView: 'main',
		fullscreen: {
			trackTitle: '.npv-track-metadata__name',
			artistName: '.npv-track-metadata__creator-name',
			albumArt: '.npv-cover-art img.npv-cross-fade-image.npv-cross-fade--next',//but like here cus like
			songPlaying: '.encore-text.encore-text-body-medium.encore-internal-color-text-base.playback-bar__progress-time-elapsed', // replace soon because idk if thats right
			progressBar: 'div[data-testid="playback-duration"]',
			lyricFadeToBlack: '.npv-lyrics__gradient.npv-lyrics__gradient-background.npv-lyrics__gradient--shown.npv-lyrics__gradient--full-screen',
			lyrics: {
				viewcontainer: '.npv-lyrics__content.npv-lyrics__content--full-screen',
				container: '.npv-lyrics__text--unsynced',
				containerParent: '.npv-lyrics__content.npv-lyrics__content--full-screen',
				scroller: '#lyrics-view',
				general: 'ffs-lyric',
				active: '.active',
				unsupportedcontainer: '#lyrics-view',
				past: '.past',
				remove: [
					'.npv-lyrics__sentences',
					'.npv-lyrics__text--unsynced-warning',
				]
			}
		},
		normal: {
			trackTitle: 'div.encore-text.encore-text-body-small a[data-testid="context-item-link"]',
			artistName: 'div[data-encore-id="text"].encore-text.encore-text-marginal.encore-internal-color-text-subdued a[data-testid="context-item-info-artist"]',
			songPlaying: '.encore-text.encore-text-marginal.encore-internal-color-text-subdued.playback-bar__progress-time-elapsed',
			enjoyLyricsOnSpotifyPremium: '.zPI8TW58LMxEQDIq_GdA',
			lyricFadeToBlack: '.hS_lrRHiW4BSWL8WcE8Q',
			otherFader: '.FUYNhisXTCmbzt9IDxnT',
			albumArt: 'button[data-testid="cover-art-button"] > div > div > img', // its that!
			progressBar: 'div[data-testid="playback-duration"]',
			lyrics: {
				viewcontainer: '.gqaWFmQeKNYnYD5gRv3x',
				container: '._Wna90no0o0dta47Heiw',
				containerParent: '.FUYNhisXTCmbzt9IDxnT',
				scroller: '.main-view-container__scroll-node-child-spacer',
				general: 'ffs-lyric',
				active: 'EhKgYshvOwpSrTv399Mw',
				unsupportedcontainer: '.FUYNhisXTCmbzt9IDxnT',
				past: 'aeO5D7ulxy19q4qNBrkk'
			}
		},
		buttons: {
			// I have an insanely bad idea //me every day
			mainLyrics: 'button[data-testid="lyrics-button"]',
			fullScreen: 'path[d="M6.53 9.47a.75.75 0 0 1 0 1.06l-2.72 2.72h1.018a.75.75 0 0 1 0 1.5H1.25v-3.579a.75.75 0 0 1 1.5 0v1.018l2.72-2.72a.75.75 0 0 1 1.06 0zm2.94-2.94a.75.75 0 0 1 0-1.06l2.72-2.72h-1.018a.75.75 0 1 1 0-1.5h3.578v3.579a.75.75 0 0 1-1.5 0V3.81l-2.72 2.72a.75.75 0 0 1-1.06 0z"]',
			playPause: 'button[data-testid="control-button-playpause"]',
		}
	},
	convertTimestampToMs: (timestamp) => timestamp.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time), 0) * 1000,
	findLyrics: (track, artist, album, duration) => {
		return fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}&album_name=${encodeURIComponent(album)}&duration=${duration / 1000}`)
			.then(res => res.json())
			.then(data => data.syncedLyrics || data.plainLyrics);
	},
	cache: { checked: false, expiry: 0, token: null },
	// yes, it's bi scu
	token: async () => {
		// lol its alright
		if (spotifyFormatter.cache.checked && spotifyFormatter.cache.expiry > Date.now()) {//waut yeah sorry ab
			console.log("cache")
			return spotifyFormatter.cache;
		} else {
			console.log("garb")
			// tahsts the proper way of doing that.. i think..
			let token, data;
			try {
				token = await fetch((spotifyFormatter.desktop ? spotifyFormatter.proxy : '') + "https://open.spotify.com/get_access_token")
				.catch(err => { console.error(err); });
				data = await token.json().catch(err => { console.error(err); 
					data = { accessToken: null, accessTokenExpirationTimestampMs: 0 };
				});
			} catch(er) {
				data = { accessToken: null, accessTokenExpirationTimestampMs: 0 };
			}
			spotifyFormatter.cache = { token: data.accessToken, expiry: data.accessTokenExpirationTimestampMs, checked: Date.now() };
			// yes there is and i implemented the edge case explosion 4 seconds ago
			return spotifyFormatter.cache;
		}
	},
	getSongDetails: async (title, artist, element, token) => {
		var offsetC = 0;
		var validSearch = false;
		var item;
		while (!validSearch) {
			if (offsetC >= 5) return "max attempts";
			const urlSpotify = (spotifyFormatter.desktop ? spotifyFormatter.proxy : '') + `https://api.spotify.com/v1/search/?q=track:${encodeURIComponent(title)} artist:${encodeURIComponent(artist)}&type=track&market=from_token&limit=1&offset=${offsetC}`;
			try {
				const res = await fetch(urlSpotify, {
					headers: {
						'Authorization': `Bearer ${token.token}`,
						'Content-Type': 'application/json'
					}
				});
				if (!res.ok) {
					throw new Error("spotify search request errored; this shouldnt happen?");
				}
				const data = await res.json();
				item = data.tracks.items[0];
				if (item) {
					for (let i = 0; i < item.album.images.length; i++) {
						console.log(`Image ${i}:`, item.album.images[i].url, "Trying to find: ", element.src);
						if (element.src === item.album.images[i].url) {
							validSearch = true;
							break;
						}
					}
				} else {
					return "ran out of search options";
				}
				offsetC++;
			} catch (error) {
				console.log(error.message);
				return null;
			} // so we yoinkity sploinkity
		}
		return { album: item.album.name, durationMs: item.duration_ms }; // thats.. seconds not ms spotify
	},
	async getLyricsForMode(mode = 'normal') {//im like in awe rn  //ur good at this :sob: :3
		return new Promise((res, rej) => {
			const trackTitle = document.querySelector(spotifyFormatter.finds[mode].trackTitle).textContent;
			const artistName = document.querySelector(spotifyFormatter.finds[mode].artistName).textContent;
			spotifyFormatter.token().then(async (token) => {
				let details;
				try {
					details = await spotifyFormatter.getSongDetails(
						trackTitle,
						artistName,
						document.querySelector(spotifyFormatter.finds[mode].albumArt),
						token
					);
				} catch(er) {
					details = {
						album: "Unknown",
						durationMs: 0
					}
				}
				let lyrics = '';
				try {
					const title = details.album;
					lyrics = await spotifyFormatter.findLyrics(
						trackTitle,
						artistName,
						title,
						details.durationMs
					)
				} catch (err) {
					console.error(err, 'falling back to search API');
					lyrics = await spotifyFormatter.fallbackSearch(trackTitle, artistName);
				};
				if (!localStorage.getItem("lyrics_raw")) localStorage.setItem("lyrics_raw", JSON.stringify({}));
				if (!localStorage.getItem('lyrics')) localStorage.setItem('lyrics', JSON.stringify({}));
				const lyricsCache = JSON.parse(localStorage.getItem("lyrics_raw"));
				lyricsCache[trackTitle] = lyrics;
				// so here's a fun fact, we can do like the current play time and with a loop like update
				//wouldnt u regex it now or is there a like way si
				localStorage.setItem("lyrics_raw", JSON.stringify(lyricsCache));
				let lyrSynced = spotifyFormatter.parseLyrics(lyrics, trackTitle);
				// let correctContainer = document.querySelector(spotifyFormatter.finds[mode].lyrics.container);
				// if(!document.querySelector(spotifyFormatter.finds[mode].enjoyLyricsOnSpotifyPremium))
				// 	correctContainer = document.querySelector(spotifyFormatter.finds[mode].lyrics.unsupportedcontainer);
				if(document.querySelector(spotifyFormatter.finds[mode].lyrics.container)) document.querySelector(spotifyFormatter.finds[mode].lyrics.container).style.display = 'none';
				if(document.querySelector('#lyrics-container')) document.querySelector('#lyrics-container').remove();
				if(mode == 'fullscreen') document.querySelector(spotifyFormatter.finds[mode].lyrics.container).remove();
				let viewContainer = document.createElement('div');
				viewContainer.id = 'lyrics-container';
				if(mode == 'fullscreen') {
					spotifyFormatter.finds[mode].lyrics.remove.forEach((selector) => {
						document.querySelector(selector).remove();
					});
				}
				if (mode == 'normal') viewContainer.classList.add(spotifyFormatter.finds[mode].lyrics.viewcontainer.split('.')[1]);
				else viewContainer.classList.add(spotifyFormatter.finds[mode].lyrics.container.split('.')[1]);
				let correctContainer = document.createElement('div');
				correctContainer.id = 'lyrics-view';
				correctContainer.classList.add(spotifyFormatter.finds[mode].lyrics.container.split('.')[1]);
				viewContainer.appendChild(correctContainer);
				document.querySelector(spotifyFormatter.finds[mode].lyrics.containerParent).appendChild(viewContainer);
				spotifyFormatter.populateLyricContainer(lyrSynced, correctContainer, mode);
				document.querySelector(spotifyFormatter.finds[mode].lyrics.scroller).parentElement.style.scrollBehavior = 'smooth';

				res(lyrSynced); // this allows us to use .then() or await it!// beaoayaya
			}).catch(async (err) => {
				console.error(err);
				await spotifyFormatter.fallbackSearch(trackTitle, artistName).then(lyrics => {
					const lyrSynced = spotifyFormatter.parseLyrics(lyrics, trackTitle);
					res(lyrSynced);
				}).catch(err => {
					console.error(err);
					rej(err);
				});
			});
		})
	},
	async fallbackSearch(track, artist) {
		return new Promise((res, rej) => {
			fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`)
			.then(res => res.json())
			.then(data =>{
				console.log(data)
				res(data[0].syncedLyrics || data[0].plainLyrics);
			});
		})
	},
	parseLyrics: (lyrics, trackTitle) => {
		let parsed = [];
		lyrics.split('\n').forEach(line => {
			let startMinutes = line.split('[')[1].split(':')[0];
			let startSeconds = line.split('[')[1].split(':')[1].split(']')[0];
			let lyric = line.split(']')[1];
			let start = spotifyFormatter.convertTimestampToMs(`${startMinutes}:${startSeconds}`);
			parsed.push({ start, lyric });
		});
		localStorage.setItem("lyrics", JSON.stringify({ [trackTitle]: parsed }));
		return parsed;
	},
	populateLyricContainer: (lyrics, container, mode = 'normal') => {
		container.innerHTML = '';
		lyrics.forEach(lyric => {
			const element = document.createElement('div');
			if (lyric.lyric === '') element.textContent = '♫';
			else element.textContent = lyric.lyric;
			element.dataset.start = lyric.start;
			element.classList.add(spotifyFormatter.finds[mode].lyrics.general);
			element.style.color = 'var(--lyrics-color-inactive)';
			element.style.transitionDuration = '0.5s';
			container.appendChild(element);
		})
		console.log('Populated lyrics container');
	},
	update: (time, currentLyrics, mode = 'normal', supportsLyricsNative=true) => {
		// it cant be like exactly 1000 removed i think becuase what if we dont hit it at the exact time
		console.log(time, currentLyrics)
		const currentLyric = currentLyrics.find(lyric => lyric.start <= time && lyric.start + spotifyFormatter.lyricsMaxTime >= time);
		const lyricElements = document.querySelectorAll(`${spotifyFormatter.finds[mode].lyrics.unsupportedcontainer} .${spotifyFormatter.finds[mode].lyrics.general}`);
		if (typeof currentLyric === 'undefined') return;
		lyricElements.forEach(element => {
			if (element.textContent === currentLyric.lyric && element.dataset.start === currentLyric.start.toString()) {
				console.log('found my lyric')
				console.log(element.classList)
				element.style.color = 'var(--lyrics-color-active)';
				if (mode == 'normal') document.querySelector(spotifyFormatter.finds[mode].lyrics.scroller).parentElement.scrollTo(0, element.offsetTop - 250);
				else document.querySelector(spotifyFormatter.finds[mode].lyrics.scroller).scrollTo(0, element.offsetTop - 250);
			} else {
				if (element.dataset.start < currentLyric.start) {
					element.style.color = 'var(--lyrics-color-passed)';
				} else {
					element.style.color = 'var(--lyrics-color-inactive)';
				}
			}
		});
		console.log('Updated lyrics');
	},
	lyricsPollRate: 500,
	lyricsMaxTime: 1000,
	timeUpdateRate: 250,
	runLyrics(mode = 'normal') {
		if(!document.querySelector(spotifyFormatter.finds.mainView + ' > ' + spotifyFormatter.finds[mode].lyrics.unsupportedcontainer)) {
			const lyricContainer = document.createElement('div');
			lyricContainer.classList.add(spotifyFormatter.finds[mode].lyrics.unsupportedcontainer.split('.')[1]);
			document.querySelector(spotifyFormatter.finds.mainView).parentElement.appendChild(lyricContainer);
		}
		let spotEn = document.querySelector(spotifyFormatter.finds[mode].enjoyLyricsOnSpotifyPremium);
		if (document.querySelector(spotifyFormatter.finds[mode].lyricFadeToBlack)) document.querySelector(spotifyFormatter.finds[mode].lyricFadeToBlack).style.display = "none";
		if (mode == 'normal') {
			if(spotEn) {
				document.querySelector(spotifyFormatter.finds[mode].enjoyLyricsOnSpotifyPremium).style.display = "none";
				document.querySelector(spotifyFormatter.finds[mode].otherFader).style.cssText = document.querySelector(spotifyFormatter.finds[mode].otherFader).style.cssText.replace('--show-gradient-over-lyrics: block;', '--show-gradient-over-lyrics: none;');
			} else {
				document.querySelector(spotifyFormatter.finds[mode].lyrics.unsupportedcontainer).classList.add(spotifyFormatter.newClasses.lyricContainerUnsupported);
				document.querySelector(spotifyFormatter.finds[mode].lyrics.unsupportedcontainer).style.cssText = '';
				document.querySelector(spotifyFormatter.finds[mode].lyrics.scroller).parentElement.style.background = 'linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%)';
			}
		}
		let theGiver = spotEn ? true : false;
		spotifyFormatter.stop();
		const time = spotifyFormatter.convertTimestampToMs(document.querySelector(spotifyFormatter.finds[mode].songPlaying).textContent);
		spotifyFormatter._global.songPlayingTime = time;
		const timeInterval = setInterval(() => {
			if(!document.querySelector(spotifyFormatter.finds.buttons.playPause).getAttribute('aria-label').includes('Play'))
				spotifyFormatter._global.songPlayingTime += spotifyFormatter.timeUpdateRate;
		}, spotifyFormatter.timeUpdateRate);
		const pbt = setInterval(() => {
			if(document.querySelector(spotifyFormatter.finds[mode].progressBar))
			spotifyFormatter._global.songPlayingTime =	parseInt( document.querySelector(spotifyFormatter.finds[mode].progressBar).getAttribute('data-test-position'))
		},1000);
		spotifyFormatter._global.playbackTimer = pbt;
		spotifyFormatter._global.timeInterval = timeInterval;
		spotifyFormatter.getLyricsForMode(mode).then((currentLyrics) => {
			const interval = setInterval(() => {
				spotifyFormatter.update(spotifyFormatter._global.songPlayingTime, currentLyrics, mode, theGiver);
			}, spotifyFormatter.lyricsPollRate);
			spotifyFormatter._global.syncTimer = interval;
		});
	},
	stop: () => {
		clearInterval(spotifyFormatter._global.syncTimer);
		clearInterval(spotifyFormatter._global.songPlayingTime);
		clearInterval(spotifyFormatter._global.timeInterval);
	},
	_global: {
		songPlayingTime: 0,
		playbackTimer: null,
		syncTimer: null,
		timeInterval: null
	},
	createListeners: (mode = 'normal') => {
		switch(mode) {
			case 'normal':
				document.querySelector(spotifyFormatter.finds[mode].trackTitle).addEventListener('change', () => {
					spotifyFormatter.runLyrics(mode);
				});
				document.querySelector(spotifyFormatter.finds.buttons.mainLyrics).addEventListener('click', () => {
					spotifyFormatter.runLyrics(mode);
				});
				break;
			case 'fullscreen':
				document.querySelector(spotifyFormatter.finds.buttons.fullScreen).addEventListener('click', () => {
					spotifyFormatter.runLyrics(mode);
				});
				break;
		}
	},
	forceCreateLyricButton: () => {
	}
}

const styles = `
:root {
	--lyrics-color-inactive: #b3b3b3;
	--lyrics-color-active: #1db954;
	--lyrics-color-passed: #666666;
}
.${spotifyFormatter.finds.normal.lyrics.containerParent} {
	display: grid;
	grid-template-rows: 1fr;
	height: 100%;
	margin-top: -64px;
}
.${spotifyFormatter.newClasses.lyricContainerUnsupported} {
	--lyrics-color-inactive: #b3b3b3;
	--lyrics-color-active: #1db954;
	--lyrics-color-passed: #666666;	
	--lyrics-color-background: #333333;
	text-align: center;
	font-size: 1.75em;
}
#lyrics-container {
	background-color: black;
	background-color: var(--lyrics-color-background);
	width: 100%;
	height: 100%;
	padding: 10px;
}
#lyrics-view {
	height: 100%;
	font-size: 1.5em;
	font-weight: 600;
	overflow-y:scroll;
}
`
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);

spotifyFormatter.forceCreateLyricButton();
waitForElement(spotifyFormatter.finds.buttons.fullScreen,(element) => { // fullscreen logic
	element.addEventListener('click',(ev) => { 
		console.log("clicky clacky");
		waitForElement('.npv-track__name', (element) => {
			spotifyFormatter.runLyrics('fullscreen')//initial setup
			const trackChangeF = new MutationObserver(entries => {
				spotifyFormatter.runLyrics('fullscreen'); //recurring lyrics
			});
			trackChangeF.observe(document.querySelector('.npv-track__name'), {
				subtree: true,
				characterData: true
			});
			const closeFullscreen = new MutationObserver(entries => { //add lyrics to windowed mode if fullscreen mode is exited
				if(document.querySelector(".spotifyinternal-artistnpv")===null) {
					spotifyFormatter.runLyrics();
					closeFullscreen.disconnect();
				}
			});
			closeFullscreen.observe(document.querySelector("body"), { //could've been more efficient but the fullscreen stuff is on the body directly
			  childList: true,
			  subtree: true
			});
		});
	});
});

waitForElement('button[aria-label="Upgrade to Premium"]',(element)=> { // hide premium button
	element.innerText = 'SpotifyFormatter v' + spotifyFormatter.version;
});

waitForElement('div.deomraqfhIAoSB3SgXpu',(element) => { // fullscreen logic
	document.querySelector('button[aria-label="Full screen"]').addEventListener('click',(ev) => { 
		console.log("clicky clacky");
		waitForElement('.npv-track__name', (element) => {
			spotifyFormatter.runLyrics('fullscreen'); //initial setup
			const trackChangeF = new MutationObserver(entries => {
				spotifyFormatter.runLyrics('fullscreen'); //recurring lyrics
			});
			trackChangeF.observe(document.querySelector('.npv-track__name'), {
				subtree: true,
				characterData: true
			});
			const closeFullscreen = new MutationObserver(entries => { //add lyrics to windowed mode if fullscreen mode is exited
				if(document.querySelector(".spotifyinternal-artistnpv")===null) {
					spotifyFormatter.runLyrics();
					closeFullscreen.disconnect();
				}
			});
			closeFullscreen.observe(document.querySelector("body"), { //could've been more efficient but the fullscreen stuff is on the body directly
			  childList: true,
			  subtree: true
			});
		});
	});
});

waitForElement(spotifyFormatter.finds.buttons.mainLyrics, (element) => {
	element.addEventListener('click', () => {
		spotifyFormatter.runLyrics();
		waitForElement(spotifyFormatter.finds.normal.enjoyLyricsOnSpotifyPremium, (element) => {
			element.style.display = "none";
			document.querySelector(spotifyFormatter.finds.normal.lyricFadeToBlack).style.display = "none";
			document.querySelector(spotifyFormatter.finds.normal.otherFader).style.cssText = document.querySelector(spotifyFormatter.finds.normal.otherFader).style.cssText.replace('--show-gradient-over-lyrics: block;', '--show-gradient-over-lyrics: none;');
		});		
		const trackChangeW = new MutationObserver(entries => {
			if(document.querySelector(".spotifyinternal-artistnpv")===null){ //if in fullscreen, dont add lyrics to windowed mode
				spotifyFormatter.runLyrics();				//recurring lyrics
			}
		});
		trackChangeW.observe(document.querySelector("div.j96cpCtZAIdqxcDrYHPI"), {
			subtree: true,
			childList: true
		});
	});
})
console.log("SpotifyFormatter running");
function waitForElement(selector, callback) {
    const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            obs.disconnect(); // Stop observing after the element is found
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

async function querySelectorAsync(selector) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                obs.disconnect(); // Stop observing after the element is found
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
