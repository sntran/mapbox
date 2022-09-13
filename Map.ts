import { Tile } from "./Tile.ts";

export interface MapOptions {
  center: string | { lat: number, lng: number },
  zoom: number,
  url: string,
}

export class Map {
  tiles: Tile[];
  viewbox: string;

  constructor(width: number, height: number, options: Partial<MapOptions> = {}) {
    let {
      center = { lat: 360, lng: 170.1022 },
      zoom = 0,
      url,
    } = options;

    if (typeof center === "string") {
      const [lat, lng] = center.split(",").map(Number);
      center = { lat, lng };
    }

    const centerTile = Tile.at(center.lng, center.lat, zoom);
    const tiles = this.tiles = centerTile.map(width, height);
    const { x: minX, y: minY } = tiles[0];
    const { x: maxX, y: maxY } = tiles.at(-1);
    this.viewbox = `${minX} ${minY} ${maxX + 1 - minX} ${maxY + 1 - minY}`;
  }

  get svg() {
    const { tiles, viewbox } = this;
    const mapper = (tile) => {
      const { x, y, zoom } = tile;
      return `<image 
        x="${x}" y="${y}" width="1" height="1" 
        href="/${zoom}/${x}/${y}.png" 
      />`;
    }

    return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg">

      <svg viewBox="${viewbox}" preserveAspectRatio="xMidYMid slice">
        <title>Tile Layer</title>

        ${tiles.map(mapper).join("\n")}
      </svg>

    </svg>`;
  }
}
