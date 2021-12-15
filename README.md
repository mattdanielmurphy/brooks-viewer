# Brooks Viewer
[Trello -- Brooks Viewer To Do](https://trello.com/b/9FnXMYrH/brooks-viewer)


## Info
### How it works
## Backend
Dir: `main`
- starts with background.ts
- creates window
- handles retrieval of data (lowDB = just local JSON files, as well as local images)

## Compiled
Dir: `app`

### Setup
- data must currently be supplied manually:
  - `./renderer/public/price-action/images/`
  - `./renderer/public/trading-course/images/`
  - not sure about `/app` now... is currently set to prod dir which is `~/Library/Application Support/brooks-viewer` on macOS
  - `./app/data/price-action/html/`
  - `./app/data/price-action/images/`
  - `./app/data/trading-course/html/`
  - `./app/data/trading-course/images/`
- files in (`./app/`)

## Doing Now

- REFACTOR: clean up and modularize