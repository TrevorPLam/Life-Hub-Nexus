---
name: Calendar module architecture
description: How the calendar feature is structured after the full rebuild — data model, views, components, and recurrence logic.
---

# Calendar Module

## Data model (`context/CalendarContext.tsx`)
- `CalendarEvent` has `recurrence: Recurrence` field (`'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'`)
- `occursOnDate()` helper determines whether a recurring event appears on a given day; used by `getEventsForDate`
- Seed events are updated to include `recurrence` field; old events are migrated on load with `recurrence: 'none'` default

## Views (`app/(tabs)/calendar.tsx`)
- Three views: `month | week | day` (replaces `month | week | 3day`)
- Month view: tap a day cell → jumps to that day in `day` view
- Week view: horizontal date strip + `TimeGrid` for selected day
- Day view: prev/next navigation + `TimeGrid`
- Month view event dots only check raw `startDate` (not recurrence) — performance tradeoff

## TimeGrid (`components/calendar/TimeGrid.tsx`)
- `HOUR_HEIGHT = 60` px per hour; 24 hours total (1440px scrollable height)
- Events positioned absolutely using `timeToY(date)` helper
- Basic overlap detection assigns events to columns; `eventMeta` map stores `{ col, numCols }`
- All-day events shown in a banner above the grid (not in the hour grid)
- Current-time red line shown only when `date` matches today
- Scrolls to current time −2h on mount (or 8am if not today)
- Tapping a time slot calls `onSlotPress(time: Date)` — currently navigates to `/calendar/new`

## Create/Edit form (`app/calendar/new.tsx`)
- Handles both create and edit: reads `id` query param via `useLocalSearchParams`
- Edit mode: pre-fills all state from `getEvent(id)`, calls `updateEvent` on save
- Uses `DatePickerModal` (title prop added) for date selection
- Uses `TimePickerModal` (new) for start/end time selection
- Inline people/task linking with FlatList modals (no LinkedItems component needed)
- Recurrence selector: pill buttons for None/Daily/Weekly/Biweekly/Monthly
- Preview card shows live event appearance

## TimePickerModal (`components/ui/TimePickerModal.tsx`)
- 12-hour format with AM/PM drum columns (Hour: [12,1…11], Minutes: 5-min increments, Period: AM/PM)
- `dateToIndices(d)` / `applyIndices(base, hour, min, period)` helpers for conversion
- Accepts `value: Date`, returns updated `Date` (preserving date part, updating time)
- Title prop configurable

## DatePickerModal (`components/ui/DatePickerModal.tsx`)
- Added `title?: string` prop (defaults to 'Select Date', was hardcoded 'Select Birthday')

## Detail screen (`app/calendar/[id].tsx`)
- Edit button in `ScreenHeader` rightElement → navigates to `/calendar/new?id={event.id}`
- Recurrence label shown in the color header card (refresh-cw icon + text)
- Delete moved to bottom as a full-width button (not in header)
