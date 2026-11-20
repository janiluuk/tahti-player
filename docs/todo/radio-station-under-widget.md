# Added radio stations should sit under the radio widget

**Status:** open

## Bug

When the user adds a radio station, the new station should appear **under the radio widget** (the existing Listen/Radio stations row). Instead, stations show up on an **empty row** of their own.

Likely surfaces: Listen home `RadioStationsRow` / listener widgets, and/or Radio page (`FavoriteStationsRow` + `RadioStationsRow` in [`RadioView.tsx`](../../packages/tahti-web/src/views/RadioView.tsx)). Own stations come from `ownStations` / add-by-URL (`AddStationUrlDialog`, `RadioStationRowActions`).

## Done when

- Adding a station places the card in the same radio stations row/widget as the other stations (no orphan empty row).
- Covered by a unit or view test for the add → render path.
