import {Room, Client, DataChange} from "colyseus.js";

interface MyRoom extends Room {
  moveTicks: number,
  intervalId: any,
  updateLogic: (this: MyRoom) => void
}

export function updateLogic(this: MyRoom) {
  if (this.moveTicks === 0) {
    const x = Math.random() * 720 | 0;
    const y = Math.random() * 1280 | 0;
    this.send('click', {x, y});

    this.moveTicks = (Math.random() * 10 + 5) | 0;
  } else {
    this.moveTicks--;
  }
}

export function requestJoinOptions(this: Client, i: number) {
  return {
    is_bot: i + 1,
    nickname: `load_bot_${i + 1}`
  };
}

export function onJoin(this: MyRoom) {
  this.updateLogic = updateLogic;
  this.moveTicks = (Math.random() * 10 + 5) | 0;

  this.intervalId = setInterval(() => {
    this.updateLogic();
  }, 10 + (Math.random() * 50 | 0));

  console.log(this.sessionId, "joined.");
}

export function onMessage(this: MyRoom, message) {
}

export function onLeave(this: MyRoom) {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
  console.log(this.sessionId, "left.");
}

export function onError(this: MyRoom, err) {
  console.log(this.sessionId, "!! ERROR !!", err.message);
}

export function onStateChange(this: MyRoom, state) {
}
