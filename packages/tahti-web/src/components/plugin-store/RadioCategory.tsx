import { RadioBrowserDirectoryCard } from './radio-category/RadioBrowserDirectoryCard';
import { SuggestStationForm } from './radio-category/SuggestStationForm';

export function RadioCategory() {
  return (
    <div className="flex flex-col gap-3">
      <RadioBrowserDirectoryCard />
      <SuggestStationForm />
    </div>
  );
}
