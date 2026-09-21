import { PersonalRadioStreamCard } from './radio-category/PersonalRadioStreamCard';
import { RadioBrowserDirectoryCard } from './radio-category/RadioBrowserDirectoryCard';
import { SuggestStationForm } from './radio-category/SuggestStationForm';

export function RadioCategory() {
  return (
    <div className="flex flex-col gap-3">
      <PersonalRadioStreamCard />
      <RadioBrowserDirectoryCard />
      <SuggestStationForm />
    </div>
  );
}
