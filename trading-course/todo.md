# To Do

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



- goal is to have 1 html file that presents everything--perhaps next.js is the way to go? need to load a large amount of data
- best to retrieve all information now rather than later because they might change their formatting
- design to download all **with a lot of debugging**, then retrieve from disk on runtime

## Current Flow of Functions
scrape->
  getPostURLs()
    
  getContentFromPages()