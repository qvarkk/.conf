import React, {
  useState,
  useEffect,
  useRef,
} from 'https://esm.sh/react@18?dev';
import { createRoot } from 'https://esm.sh/react-dom@18/client?dev';
import * as zebar from 'https://esm.sh/zebar@3.0';

const providers = zebar.createProviderGroup({
  audio: { type: 'audio' },
  network: { type: 'network' },
  glazewm: { type: 'glazewm' },
  cpu: { type: 'cpu' },
  date: { type: 'date', formatting: 'EEE d MMM t' },
  keyboard: { type: 'keyboard', refreshInterval: 1000 },
  media: { type: 'media' },
  battery: { type: 'battery' },
  memory: { type: 'memory' },
  weather: { type: 'weather' },
});

createRoot(document.getElementById('root')).render(<App />);

const GlazeWorkspaceDisplay = ({ output }) => {
  return (
    <div className="workspaces">
      {output.glazewm.currentWorkspaces.map(workspace => (
        <button
          className={`workspace ${workspace.hasFocus && 'focused'} ${workspace.isDisplayed && 'displayed'}`}
          onClick={() =>
            output.glazewm.runCommand(
              `focus --workspace ${workspace.name}`,
            )
          }
          key={workspace.name}
        >
          {workspace.displayName ?? workspace.name}
        </button>
      ))}
    </div>
  );
};

const GlazeInfoDisplay = ({ output }) => {
  return (
    <>
      {output.glazewm.isPaused && (
        <button
          className="paused-button"
          onClick={() =>
            output.glazewm.runCommand('wm-toggle-pause')
          }
        >
          PAUSED
        </button>
      )}
      {output.glazewm.bindingModes.map(bindingMode => (
        <button
          className="binding-mode"
          key={bindingMode.name}
          onClick={() =>
            output.glazewm.runCommand(
              `wm-disable-binding-mode --name ${bindingMode.name}`,
            )
          }
        >
          {bindingMode.displayName ?? bindingMode.name}
        </button>
      ))}

      <button
        className={`tiling-direction nf ${
          output.glazewm.tilingDirection === 'horizontal'
            ? 'nf-md-swap_horizontal'
            : 'nf-md-swap_vertical'
        }`}
        onClick={() =>
          output.glazewm.runCommand('toggle-tiling-direction')
        }
      ></button>
    </>
  );
};

const NetworkDisplay = ({ output }) => {
  function getNetworkIcon(networkOutput) {
    switch (networkOutput.defaultInterface?.type) {
      case 'ethernet':
        return <i className="nf nf-md-ethernet_cable"></i>;
      case 'proprietary_virtual':
        return <i className="nf nf-md-shield_lock_outline"></i>;
      case 'wifi':
        if (networkOutput.defaultGateway?.signalStrength >= 80) {
          return <i className="nf nf-md-wifi_strength_4"></i>;
        } else if (
          networkOutput.defaultGateway?.signalStrength >= 65
        ) {
          return <i className="nf nf-md-wifi_strength_3"></i>;
        } else if (
          networkOutput.defaultGateway?.signalStrength >= 40
        ) {
          return <i className="nf nf-md-wifi_strength_2"></i>;
        } else if (
          networkOutput.defaultGateway?.signalStrength >= 25
        ) {
          return <i className="nf nf-md-wifi_strength_1"></i>;
        } else {
          return <i className="nf nf-md-wifi_strength_outline"></i>;
        }
      default:
        return (
          <i className="nf nf-md-wifi_strength_off_outline"></i>
        );
    }
  }

  return (
    <div className="network">
      {getNetworkIcon(output.network)}
      {output.network.defaultGateway?.ssid}
    </div>
  );
};

const MemoryDisplay = ({ output }) => {
  return (
    <div className="memory">
      <i className="nf nf-fae-chip"></i>
      {Math.round(output.memory.usage)}%
    </div>
  );
};

const CpuDisplay = ({ output }) => {
  return (
    <div className="cpu">
      <i className="nf nf-oct-cpu"></i>
      <span
        className={output.cpu.usage > 85 ? 'high-usage' : ''}
      >
        {Math.round(output.cpu.usage)}%
      </span>
    </div>
  );
};

const AudioSettings = ({ volume, onChange, onCommit }) => {
  return (
    <div className="audio-settings-menu">
      <input
        type="range" 
        min="0"
        max="100"
        className="audio-volume-input"
        value={volume}
        onChange={onChange}
        onMouseUp={onCommit}
      />
      <span className="audio-volume">
        {volume}%
      </span>
    </div>
  );
}

const AudioDisplay = ({ output, onClick }) => {
  function getAudioIcon(audioOutput) {
    if (audioOutput.defaultPlaybackDevice.volume <= 0) {
      return <i className="nf nf-fa-volume_xmark"></i>
    } else if (
      audioOutput.defaultPlaybackDevice.volume <= 25
    ) {
      return <i className="nf nf-fa-volume_off"></i>
    } else if (
      audioOutput.defaultPlaybackDevice.volume < 50
    ) {
      return <i className="nf nf-fa-volume_low"></i>
    } else {
      return <i className="nf nf-fa-volume_high"></i>
    }
  }

  return (
    <div 
      className="audio"
      onClick={onClick}
    >
      {getAudioIcon(output.audio)}
    </div>
  )
};

const BatteryDisplay = ({ output }) => {
  function getBatteryIcon(batteryOutput) {
    if (batteryOutput.chargePercent > 90)
      return <i className="nf nf-fa-battery_4"></i>;
    if (batteryOutput.chargePercent > 70)
      return <i className="nf nf-fa-battery_3"></i>;
    if (batteryOutput.chargePercent > 40)
      return <i className="nf nf-fa-battery_2"></i>;
    if (batteryOutput.chargePercent > 20)
      return <i className="nf nf-fa-battery_1"></i>;
    return <i className="nf nf-fa-battery_0"></i>;
  }

  return (
    <div className="battery">
      {output.battery.isCharging && (
        <i className="nf nf-md-power_plug charging-icon"></i>
      )}
      {getBatteryIcon(output.battery)}
      {Math.round(output.battery.chargePercent)}%
    </div>
  );
};

const WeatherDisplay = ({ output }) => {
  function getWeatherIcon(weatherOutput) {
    switch (weatherOutput.status) {
      case 'clear_day':
        return <i className="nf nf-weather-day_sunny"></i>;
      case 'clear_night':
        return <i className="nf nf-weather-night_clear"></i>;
      case 'cloudy_day':
        return <i className="nf nf-weather-day_cloudy"></i>;
      case 'cloudy_night':
        return <i className="nf nf-weather-night_alt_cloudy"></i>;
      case 'light_rain_day':
        return <i className="nf nf-weather-day_sprinkle"></i>;
      case 'light_rain_night':
        return <i className="nf nf-weather-night_alt_sprinkle"></i>;
      case 'heavy_rain_day':
        return <i className="nf nf-weather-day_rain"></i>;
      case 'heavy_rain_night':
        return <i className="nf nf-weather-night_alt_rain"></i>;
      case 'snow_day':
        return <i className="nf nf-weather-day_snow"></i>;
      case 'snow_night':
        return <i className="nf nf-weather-night_alt_snow"></i>;
      case 'thunder_day':
        return <i className="nf nf-weather-day_lightning"></i>;
      case 'thunder_night':
        return <i className="nf nf-weather-night_alt_lightning"></i>;
    }
  }

  return (
    <div className="weather">
      {getWeatherIcon(output.weather)}
      {Math.round(output.weather.celsiusTemp)}°C
    </div>
  );
};

function App() {
  const [output, setOutput] = useState(providers.outputMap);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    providers.onOutput(() => setOutput(providers.outputMap));
  }, []);

  useEffect(() => {
    if (output.audio !== null) {
      setVolume(output.audio.defaultPlaybackDevice.volume);
    }
  }, [showAudioSettings]);

  useEffect(() => {
    if (output.audio !== null) {
      setVolume(output.audio.defaultPlaybackDevice.volume);
    }
  }, [output.audio]);

  function onVolumeCommit(audioOutput) {
    if (volume === 0)
    {
      audioOutput.setMute(true);
    } else {
      audioOutput.setMute(false);
      audioOutput.setVolume(parseInt(volume));
    }

    setVolume(parseInt(volume));
  }

  function handleAudioClick() {
    setShowAudioSettings(!showAudioSettings);
  }

  return (
    <div className="app">
      <div className="left">
        {output.glazewm && <GlazeWorkspaceDisplay output={output} />}
      </div>

      <div className="center">{output.date?.formatted}</div>

      <div className="right">
        {output.glazewm && <GlazeInfoDisplay output={output} />}

        {output.network && <NetworkDisplay output={output} />}

        {output.memory && <MemoryDisplay output={output} />}

        {output.cpu && <CpuDisplay output={output} />}

        {showAudioSettings && 
          <AudioSettings 
            volume={volume} 
            onChange={(event) => setVolume(parseInt(event.target.value))} 
            onCommit={() => onVolumeCommit(output.audio)} 
          />
        }

        {output.audio && <AudioDisplay output={output} onClick={handleAudioClick} />}

        {output.battery && <BatteryDisplay output={output} />}

        {output.weather && <WeatherDisplay output={output} />}
      </div>
    </div>
  );
}