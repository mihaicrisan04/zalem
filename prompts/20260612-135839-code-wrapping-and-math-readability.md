ok i have another 2 tasks
do the inline code for file names doesnt wrap to the sseocnd line and breaks the layout padding
also do we need all of those formulas of complex math? can we go by without it or write them in a simpler easier to read manner?

---

Two thesis layout/readability fixes: (1) added a breakable `\code{}` command (xurl-based) and converted ~50 long `\texttt` file paths and identifiers across chapters 3-5 so they wrap instead of overflowing the margin, plus fixed the remaining figure/table overflows (pareto plot widths in the generator and generated files, ER diagram resizebox, ch2 positioning-table citation break), taking the build from 13 overfull-hbox warnings to 0; (2) kept all 11 numbered equations (supervisor asked for them that morning) but made them easier to read: plain-words sentence for each formula, set-notation in running prose replaced with words, "iff" and similar jargon removed.
