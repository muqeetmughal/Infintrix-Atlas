// soundManager.js

import { SOUNDS } from "../data/constants";

class SoundManager {
  audioMap = {};
  unlocked = false;

  unlock() {
    if (this.unlocked) return;

    // unlock using any sound
    const audio = new Audio(SOUNDS.CLICK);

    return audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        this.unlocked = true;
      })
      .catch(() => {});
  }

  play(key) {
    console.log("playing sound:", key);
    if (!this.unlocked) return;

    if (!this.audioMap[key]) {
      if (!SOUNDS[key]) {
        console.warn(`Sound key "${key}" not found in SOUNDS`);
        return;
      }
      this.audioMap[key] = new Audio(SOUNDS[key]);
    }

    const audio = this.audioMap[key];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

export const soundManager = new SoundManager();
