import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export interface ExifCoordinates {
  lat: number;
  lng: number;
}

type ExifReader = {
  littleEndian: boolean;
  view: DataView;
  tiffOffset: number;
};

function getReader(buffer: Buffer): ExifReader | null {
  const exifOffset = buffer.toString("ascii", 0, 6) === "Exif\0\0" ? 6 : 0;
  if (buffer.byteLength < exifOffset + 8) return null;
  const order = buffer.toString("ascii", exifOffset, exifOffset + 2);
  if (order !== "II" && order !== "MM") return null;
  const littleEndian = order === "II";
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (view.getUint16(exifOffset + 2, littleEndian) !== 42) return null;
  return { littleEndian, view, tiffOffset: exifOffset };
}

function readIfdEntries(reader: ExifReader, offset: number) {
  const { littleEndian, view, tiffOffset } = reader;
  const absolute = tiffOffset + offset;
  if (absolute < 0 || absolute + 2 > view.byteLength) return [];
  const count = view.getUint16(absolute, littleEndian);
  const entries: { tag: number; type: number; count: number; valueOffset: number }[] = [];
  for (let index = 0; index < count; index++) {
    const entryOffset = absolute + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) break;
    entries.push({
      tag: view.getUint16(entryOffset, littleEndian),
      type: view.getUint16(entryOffset + 2, littleEndian),
      count: view.getUint32(entryOffset + 4, littleEndian),
      valueOffset: entryOffset + 8,
    });
  }
  return entries;
}

function readEntryValues(reader: ExifReader, entry: { type: number; count: number; valueOffset: number }) {
  const { littleEndian, view, tiffOffset } = reader;
  const typeSize: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const size = typeSize[entry.type];
  if (!size) return [];
  const byteLength = size * entry.count;
  const offset = byteLength <= 4
    ? entry.valueOffset
    : tiffOffset + view.getUint32(entry.valueOffset, littleEndian);
  if (offset < 0 || offset + byteLength > view.byteLength) return [];

  const values: (number | string)[] = [];
  for (let index = 0; index < entry.count; index++) {
    const itemOffset = offset + index * size;
    if (entry.type === 2 || entry.type === 7) {
      values.push(String.fromCharCode(view.getUint8(itemOffset)));
    } else if (entry.type === 3) {
      values.push(view.getUint16(itemOffset, littleEndian));
    } else if (entry.type === 4) {
      values.push(view.getUint32(itemOffset, littleEndian));
    } else if (entry.type === 5) {
      const numerator = view.getUint32(itemOffset, littleEndian);
      const denominator = view.getUint32(itemOffset + 4, littleEndian);
      values.push(denominator ? numerator / denominator : NaN);
    }
  }
  return values;
}

function toDecimal(values: number[], reference: string, max: number): number | null {
  if (values.length < 3 || values.some((value) => !Number.isFinite(value))) return null;
  const decimal = values[0] + values[1] / 60 + values[2] / 3600;
  if (!Number.isFinite(decimal) || decimal < 0 || decimal > max) return null;
  return reference.toUpperCase() === "S" || reference.toUpperCase() === "W" ? -decimal : decimal;
}

function parseGpsExif(buffer: Buffer): ExifCoordinates | null {
  const reader = getReader(buffer);
  if (!reader) return null;
  const { littleEndian, view, tiffOffset } = reader;
  const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
  const gpsPointerEntry = readIfdEntries(reader, firstIfdOffset).find((entry) => entry.tag === 0x8825);
  if (!gpsPointerEntry) return null;
  const gpsPointer = readEntryValues(reader, gpsPointerEntry)[0];
  if (typeof gpsPointer !== "number") return null;

  const gpsEntries = readIfdEntries(reader, gpsPointer);
  const latitudeRef = readEntryValues(reader, gpsEntries.find((entry) => entry.tag === 1) ?? { type: 2, count: 0, valueOffset: 0 })[0];
  const latitude = readEntryValues(reader, gpsEntries.find((entry) => entry.tag === 2) ?? { type: 5, count: 0, valueOffset: 0 });
  const longitudeRef = readEntryValues(reader, gpsEntries.find((entry) => entry.tag === 3) ?? { type: 2, count: 0, valueOffset: 0 })[0];
  const longitude = readEntryValues(reader, gpsEntries.find((entry) => entry.tag === 4) ?? { type: 5, count: 0, valueOffset: 0 });
  if (typeof latitudeRef !== "string" || typeof longitudeRef !== "string") return null;

  const lat = toDecimal(latitude.filter((value): value is number => typeof value === "number"), latitudeRef, 90);
  const lng = toDecimal(longitude.filter((value): value is number => typeof value === "number"), longitudeRef, 180);
  return lat !== null && lng !== null ? { lat, lng } : null;
}

/** Reads GPS from a local source image; optimized derivatives may have no EXIF left. */
export async function readPhotoExifCoordinates(source: string | undefined): Promise<ExifCoordinates | null> {
  if (!source || !source.startsWith("/")) return null;
  const filePath = path.join(process.cwd(), "public", source.replace(/^\/+/, ""));
  try {
    const image = await sharp(await fs.readFile(filePath), { failOn: "none" }).metadata();
    return image.exif ? parseGpsExif(image.exif) : null;
  } catch {
    return null;
  }
}
