# Prompt

ok the visual bugs i have is the links in the bibilography go outside the padding of what the text have instead of wrapping to the next line

---

Fixed bibliography URLs overflowing the text margin by adding the xurl package (lets \url break at any character); build log confirmed all 7 URL overfull warnings gone (worst was 151pt over), verified visually on rendered bibliography pages, and re-zipped the thesis sources to ~/Downloads/zalem-thesis.zip for Overleaf.
