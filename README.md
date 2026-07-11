# Kustomoto

A 3D motorcycle configurator. Pick a bike, pick a part, then choose a color and paint finish — rendered live in the browser.

Built with [Next.js](https://nextjs.org) (App Router), React 19, [react-three-fiber](https://docs.pmnd.rs/react-three-fiber), Tailwind CSS v4, and Zustand.

## Bikes

- Honda ADV 150
- Yamaha NMAX
- Yamaha Aerox
- Honda PCX

Each bike is a processed GLB with its bodywork split into independently paintable zones. Paint finishes (gloss, matte, metallic, satin, chrome) map to PBR material values.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Start Customizing**.

Other scripts:

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # ESLint
```

See [CLAUDE.md](CLAUDE.md) for the model-processing pipeline (GLB analysis and splitting scripts) and how to add a new motorcycle.

## Model Credits

- "HONDA ADV 150" by Arq. Vini Boschetti (SketchUp 3D Warehouse, General Model License)
- "Nmax Motorbike" by muhecsad (Sketchfab, CC-BY-NC-SA-4.0) and "Yamaha NMAX" by Ozkar O. (3D Warehouse)
- "Yamaha Aerox Modified 155" by Pojan (Sketchfab, CC-BY-4.0) and "Yamaha Aerox 155cc" by ItoRauf (3D Warehouse)
- "Honda PCX" by DevanirGrau (Sketchfab, CC-BY-4.0)

Motorcycle designs and names are the IP of their respective manufacturers; this project is a demo/portfolio piece.
