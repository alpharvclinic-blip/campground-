# Campground Map

A map of the USA where you import Excel files of campgrounds as groups, pick a pin color for each group, toggle groups on and off, and search by state.

## Excel file format

The first sheet needs a header row. Columns (names are not case-sensitive):

| Column | Required | Notes |
| --- | --- | --- |
| Name | No | Shown in the map popup. Falls back to "Row N". |
| Address | Yes | Street address. City, State, and Zip columns are added to it if present. |
| City, State, Zip | No | Appended to the address for a more accurate lookup. |
| Notes | No | Shown in the map popup. |
| Latitude, Longitude | No | If both are present and valid, the address lookup is skipped. |

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click Add New Project, import the repository, and click Deploy. No settings need to change.

## Notes

- Saved groups are stored in the browser (localStorage) on the device you use. They are not synced across devices.
- Addresses are looked up with OpenStreetMap's Nominatim service, about one per second. Keep the tab open until an import finishes. Addresses that cannot be found are listed under their group so you can fix them and re-import.
- Map tiles and address lookups use OpenStreetMap and require no API key.
