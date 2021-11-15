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

#### Sign In
  - load [Trading Updates with Al Brooks](https://www.brookspriceaction.com/viewforum.php?f=1)
  - wait for selector: input[name="username"]
  - type username: input[name="username"]
  - type password: input[name="password"]
  - click: input[name="login"]

#### Find Analyses
  - function to search for analysis posts
    - Replies > 0
    - Author = AlBrooks

#### Save bar-by-bar to CSV

#### Save image

Broadly:

1. sign in
2. find analysis posts for given month, saving data to CSV and images

easiest safe implementation:
basic cli command: `scrape 2021-10`
opens folder with CSVs and images when done