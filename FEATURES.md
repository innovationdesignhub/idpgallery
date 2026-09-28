# IDP Gallery Field Guide

## Product

IDP Gallery is a frontend-only exhibition companion for an engineering gallery. Visitors collect five project signals by scanning real QR codes on the gallery posters, then receive a playful fruit or vegetable personality report.

## Core features

- Responsive, white-space-led gallery interface with thick ink-like borders and friendly type.
- Live camera QR scanning (via `qr-scanner`) matched against the gallery's real project URLs, with a permission-aware status state.
- Desktop-friendly demo scan path for prototyping and testing without hardware.
- Developer mode toggle with direct project selection for gallery testing.
- Five collectible project slots with image, project number, lock state, and found state.
- Project reveal modal with project context and trait contribution feedback.
- Trait scoring across mechanical, chemical, and curious dimensions.
- Dynamic report unlock after five unique project scans.
- Five personality outcomes: Broccoli, Blueberry, Carrot, Avocado, and Pineapple.
- Report includes personality title, description, strengths, weakness, flavor, and evidence images from the collected projects.
- Unlocked reports can be downloaded as a plain-text keepsake.

## Deployment notes

- The app has no backend and is compatible with Vercel static deployment.
- Camera and Web NFC require HTTPS in production and browser/device support.
- QR decoding should be connected to the gallery's project IDs using a browser decoder such as BarcodeDetector or a QR package when real hardware IDs are available.