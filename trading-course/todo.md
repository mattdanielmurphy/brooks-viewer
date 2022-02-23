# To Do

- [] add main functions:
  - [] Backend
    - [] scrapeTradingCourse
      - **arguments**
        - first page to scrape
        - last page to scrape
      - **saves each page as html**
    - [] scrapePriceAction
      - **arguments**
        - first page to scrape
        - last page to scrape
      - **saves each page as html**
    - [] getNewContent
      - scrapes from date last scraped to now
  - [] Frontend
    - [] Date Picker / Post Viewer
    - [] Bar-By-Bar Viewer (accessed through Post Viewer)


Doing right now: refactoring so everything is downloaded as its own self-contained function, then new functions will read from the local database without redownloading
considerations:
  - add good error handling to show pertinent info if something doesn't work--function will be running for a long time
    - bare min. if doesn't work log to log.json
    - eg: image doesnt save, add this object to log.json
```javascript
{
  imageSrc: string,
  pageUrl: string,
  date: [year, month, day]
}
```
  - will have to filter through images, currently downloading every image in .entry-content *with save exclusions:* `let els = document.getElementsByClassName('essb_item')`

- Things to keep in mind
  - don't worry about speed until it's a problem

## Existing Structure

1. scrape()
   1. remove 'exports' folder
   2. getPostUrls()
      1. for number of pages, get urls for each post
   3. getContentFromPages
      1. for each url:
         1. fetch html
         2. clean up text
         3. split by h2s
         4. create files for each h2 (text and images)

## New Structure
1. scrape()
   1. remove exports folder
   2. getPostUrls()
   3. saveHtmlForPostUrls()
2. getContentFromPages()









# OLD BELOW

## What I need to do for debugging:
- clean up code, make more readable
- export html marked up:
  - show entire html body with what is and is not being taken
  - what is going onto which file

## Problems
- text file name too long--grabbed body instead of heading
  - solutions:
- [x] make text file name cut off at 40 chars
- [] find out where


## Considerations
- **need to separate the downloading from the presentation:**
  - save entire html file so don't have to download it over and over
  - folder:
    - downloads
    - exports


- goal is to have 1 html file that presents everything--perhaps next.js is the way to go? need to load a large amount of data
- best to retrieve all information now rather than later because they might change their formatting
- design to download all **with a lot of debugging**, then retrieve from disk on runtime

## Current Flow of Functions
scrape->
  getPostURLs()
  getContentFromPages()


## To do before anything
**IP has been blocked for sending too many requests to the server too quickly**
- download html for all relevant posts, spaced out with random time interval
- process them offline





# Final Program

How the final program will work:

Main View

- shows date picker
- when a date is clicked user is presented with list of content for that day from brookstradingcourse.com and brookspriceaction.com
- link to brookspriceaction.com bar-by-bar analysis opens floating window with navigable bar-by-bar

Background

* when launched, downloads new content