import { GetSettingsResponse } from '@bindings/GetSettingsResponse';
import { TimerEndPayload } from '@bindings/TimerEndPayload';
import { TimerMode } from '@bindings/TimerMode';
import './style.less';
import { invoke, listen } from './utils/tauri-events';
import * as theme from './utils/theme';
import * as time from './utils/time';
import { TimerIcon, TimerUIController } from './views/timer';
import { message } from '@tauri-apps/api/dialog';

theme.followSystemTheme();

let {
  mode,
  cycle,
  duration: durationSecs,
} = await invoke<TimerStatePayload>('get_timer_state');
const timerUI = new TimerUIController();
let lastTickTime = '';

timerUI.setText('');
timerUI.showIcon(TimerIcon.Play);

listen<number>('timer-tick', ({ payload: timeSecs }) => {
  lastTickTime = time.formatTime(timeSecs);
  timerUI.setText(time.formatTime(timeSecs));
  timerUI.setProgress(((timeSecs / durationSecs) * 100 - 100) * -1);
});

listen<TimerStatePayload>('timer-state', ({ payload }) => {
  mode = payload.mode;
  cycle = payload.cycle;
  durationSecs = payload.duration;

  if (payload.is_ended) {
    timerUI.showIcon(TimerIcon.Play);
    timerUI.setText('');
    timerUI.setCycle(0);
    message('Timer is done', { type: 'info' }).then(() =>
      invoke('toggle_timer')
    );
  } else {
    timerUI.setMode(mode);
    timerUI.setCycle(cycle % 5);
  }
});

listen<boolean>('timer-running-change', ({ payload: isRunning }) => {
  if (isRunning) {
    timerUI.hideIcon(TimerIcon.Play);
    timerUI.setMode(mode);
    timerUI.setCycle(cycle % 5);
    timerUI.setText(lastTickTime);
  } else {
    timerUI.showIcon(TimerIcon.Play);
    timerUI.setText('');
    timerUI.setCycle(0);
  }
});

window.addEventListener('click', () => invoke('toggle_timer'));
