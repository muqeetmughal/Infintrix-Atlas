import { useRef } from "react";
import notificationSound from "../sounds/notification.mp3";

export function EnableSound({ onEnabled }) {
  const audioRef = useRef(new Audio(notificationSound));

  const enable = async () => {
    try {
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      onEnabled(audioRef.current);
    } catch (e) {
      console.error("Audio unlock failed", e);
    }
  };

  return <button onClick={enable}>Enable notifications</button>;
}
