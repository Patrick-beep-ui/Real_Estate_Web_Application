# Plan: Add more spacing around Tarek signature

## Goal
Even out the spacing above and below the signature image.

## File
`src/components/about/AboutTarek.tsx:68`

## Change
Update the Image className from:
```
h-auto w-40 mb-6 opacity-80
```
To:
```
h-auto w-40 my-8 opacity-80
```

This adds equal 32px margin top and bottom, matching the spacing the text block already uses (`mb-8`).
