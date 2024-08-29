Created `raw_html.txt` by going to (this link)[https://eldenring.wiki.fextralife.com/Game+Progress+Route], right clicking and selecting "source code". Then a simple CTRL+A -> CRTL+C -> CRTL+V

File is then cleaned manually :

1. Find the `<div class="row">` that correspond to the text.
2. Isolate the divs with text using the regex `<div class="col-sm-8">(.|\n)+?</div>`.
   - Careful! One of the section is not in a `<div class="col-sm-8">`.
3. Delete the content between these divs
   - Automatically by putting them between new tags and searching and deleting with a regex (`</ISOLATE>(.|\n)+?<ISOLATE>`)
   - Manually check for and delete useless info at the end and start of file
4. Get rid of HTML tags with regex `<.+?>`
5. Replace or delete coded special characters (find them with `&.+?;` and replace most commonly used ones)
6. Delete the structures found with `\[.+?\]`
7. Clean a bit (delete useless tabs or newlines)
