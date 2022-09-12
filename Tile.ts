const {
  ceil,
  floor,
  log,
  tan,
  atan,
  cos,
  sinh,
  PI,
} = Math;
const DEGREE_TO_RADIAN = PI / 180.0;
const RADIAN_TO_DEGREE = 180.0 / PI;

export interface TileMapper<T> {
  (tile: Tile, index: number): T;
}

export class Tile {
  static readonly SIZE: number = 256;

  #x: number;
  #y: number;
  #latitude: number;
  #longitude: number;
  #zoom: number;
  #tiles: number;

  static at(longitude: number, latitude: number, zoom: number);
  static at(x: number, y: number, zoom: number): Tile {
    return new Tile(x, y, zoom);
  }

  constructor(longitude: number, latitude: number, zoom: number);
  constructor(x: number, y: number, zoom: number) {
    // Sets `zoom` first to know the number of tiles.
    this.zoom = zoom;

    if (Number.isInteger(x)) {
      this.x = x;
      this.y = y;
    } else {
      this.longitude = x;
      this.latitude = y;
    }
  }

  get zoom(): number {
    return this.#zoom;
  }

  set zoom(zoom: number) {
    this.#zoom = zoom;
    this.#tiles = 2 << (zoom - 1);
  }

  set longitude(longitude: number) {
    this.#longitude = longitude;
    this.#x = (longitude + 180) / 360 * this.#tiles;
  }

  set latitude(latitude: number) {
    this.#latitude = latitude;
    const radian = latitude * DEGREE_TO_RADIAN;
    this.#y = (1 - log(tan(radian) + 1 / cos(radian)) / PI) / 2 * this.#tiles;
  }

  get x(): number {
    return floor(this.#x);
  }

  set x(x: number) {
    this.#x = x;
    this.#longitude = x / this.#tiles * 360 - 180;
  }

  get y(): number {
    return floor(this.#y);
  }

  set y(y: number) {
    this.#y = y;
    this.#latitude = atan(sinh(PI * (1 - 2 * y / this.#tiles))) *
      RADIAN_TO_DEGREE;
  }

  /**
   * Maps tiles around a center tile that covers a rectangle box.
   */
  map<T>(width: number, height: number, mapper?: TileMapper<T>): T[] {
    const halfWidth = (0.5 * width) / Tile.SIZE;
    const halfHeight = (0.5 * height) / Tile.SIZE;

    // We need raw, not rounded value of x and y.
    const centerX = this.#x;
    const centerY = this.#y;
    const zoom = this.zoom;
    const maxTiles = this.#tiles;

    const xMin = floor(centerX - halfWidth);
    const yMin = floor(centerY - halfHeight);
    const xMax = ceil(centerX + halfWidth);
    const yMax = ceil(centerY + halfHeight);

    const tiles: T[] = [];
    let index = 0;

    for (let x = xMin; x < xMax; x++) {
      for (let y = yMin; y < yMax; y++) {
        // x and y may have crossed the date line
        const tileX = (x + maxTiles) % maxTiles;
        const tileY = (y + maxTiles) % maxTiles;
        let tile = Tile.at(tileX, tileY, zoom);
        if (mapper) {
          tile = mapper(tile, index);
        }

        tiles.push(tile);
        index++;
      }
    }

    return tiles;
  }
}
