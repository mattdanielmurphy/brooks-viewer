# Installation
run `npm install -g` in this dir

# Usage
`scrape [yyyy-mm]`


## Folder Structure
- year
  - month
    - day
      - bar-by-bar.csv
      - image.png

## Program Structure
### Functions

### Set up lowdb, simple database using local json file
then you can cache results for offline

#### Save image

Broadly:

1. sign in
2. find analysis posts for given month, saving data to CSV and images

easiest safe implementation:
basic cli command: `scrape 2021-10`
opens folder with CSVs and images when done

problem: don't know what pages have which dates
solution: crawl all pages and record urls of analysis posts, saving them to db
  update mode: add all new posts to db