# Booking Engine Logos

This directory contains locally hosted logos for booking engines to avoid external API dependencies.

## Fixed Issues

Previously, the application was using external URLs from `logo.clearbit.com` which were:
1. Not loading due to CloudFront restrictions
2. Creating external dependencies that could fail

## Current Implementation

All booking engine logos are now:
- Stored locally as SVG files
- Using brand-appropriate colors
- Lightweight and fast-loading
- No external dependencies

## Files

- `opentable.svg` - OpenTable booking system logo (Red: #DA3743)
- `vagaro.svg` - Vagaro booking system logo (Blue: #00A9E0)
- `mindbody.svg` - Mindbody booking system logo (Purple: #2E3192)

## Usage

These logos are referenced in `/frontend/src/data/merchantAccounts.ts` with the path:
```
/images/booking-engines/[name].svg
```

## Adding New Logos

To add a new booking engine logo:
1. Create an SVG file in this directory
2. Use a simple, professional design with the brand colors
3. Update the merchantAccounts.ts file to reference the new logo
4. Copy to dist folder if needed for production builds
