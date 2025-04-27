import { useTranslation } from 'react-i18next';
import { SettingsData, StartupMode } from '@common/types';

import { RadioButton } from '../common/RadioButton';
import { Select, Option } from '../common/Select'; // Import Select and Option

import { LanguageSelector } from './LanguageSelector';

const ZOOM_OPTIONS: Option[] = [
  { label: '80%', value: '0.8' },
  { label: '90%', value: '0.9' },
  { label: '100%', value: '1' },
  { label: '110%', value: '1.1' },
  { label: '120%', value: '1.2' },
  { label: '130%', value: '1.3' },
  { label: '140%', value: '1.4' },
  { label: '150%', value: '1.5' },
];

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
  onLanguageChange: (language: string) => void;
  onZoomChange: (zoomLevel: number) => void;
};

export const GeneralSettings = ({ settings, setSettings, onLanguageChange, onZoomChange }: Props) => {
  const { t } = useTranslation();

  const handleStartupModeChange = (mode: StartupMode) => {
    setSettings({
      ...settings,
      startupMode: mode,
    });
  };

  const handleStartupModeClick = (value: string) => {
    handleStartupModeChange(value as StartupMode);
  };

  const handleZoomChange = (value: string) => {
    const newZoomLevel = parseFloat(value);
    if (!isNaN(newZoomLevel)) {
      onZoomChange(newZoomLevel);
    }
  };

  return (
    <div className="space-y-8 min-h-[300px]">
      <div className="relative border border-neutral-700 rounded-md p-4">
        <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">{t('settings.gui')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <LanguageSelector language={settings.language} onChange={onLanguageChange} />
          <Select label={t('settings.zoom')} options={ZOOM_OPTIONS} value={String(settings.zoomLevel ?? 1)} onChange={handleZoomChange} />
        </div>
      </div>

      <div className="relative border border-neutral-700 rounded-md pt-2 mt-4">
        <h2 className="absolute -top-3 left-4 px-2 bg-neutral-850 text-sm font-medium text-neutral-100">{t('settings.startup.title')}</h2>
        <div className="px-4 py-3 space-y-3">
          <RadioButton
            id="startup-empty"
            name="startup-mode"
            value={StartupMode.Empty}
            checked={settings.startupMode === StartupMode.Empty}
            onChange={handleStartupModeClick}
            label={t('settings.startup.emptySession')}
          />

          <RadioButton
            id="startup-last"
            name="startup-mode"
            value={StartupMode.Last}
            checked={settings.startupMode === StartupMode.Last}
            onChange={handleStartupModeClick}
            label={t('settings.startup.lastSession')}
          />
        </div>
      </div>
    </div>
  );
};
