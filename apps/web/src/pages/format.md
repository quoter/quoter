---
title: File Format
layout: ../layouts/doc-layout.astro
---

# Quoter Import/Export File Format

Quoter supports importing and exporting a `.JSON` file containing quotes. This file can be used to transfer quotes between servers, or to create a backup of your quotes.

The file format should be an array of objects, each object representing a quote. The object should have the following properties:

- `text` (string): The text of the quote.
- `author` (string): The author of the quote.
- `createdTimestamp` (number): The timestamp of when the quote was created, in unix milliseconds.
- `editedTimestamp` (number): The timestamp of when the quote was last edited, in unix milliseconds.

`text` is the only required property, the rest are optional. The array must have at least one quote.

## Example

```
[
    {
        "text": "This is a quote",
        "author": "Nick",
        "createdTimestamp": 1622812800000,
        "editedTimestamp": 1622812800000
    },
    {
        "text": "This is another quote",
        "author": "Nick",
        "createdTimestamp": 1622812800000,
        "editedTimestamp": 1622812800000
    }
]
```
