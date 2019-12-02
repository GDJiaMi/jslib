/**
 * 地理相关工具函数
 */

const PI = 3.14159265358979324
const X_PI = (3.14159265358979324 * 3000.0) / 180.0

/**
 * 坐标类型
 */
export type CoordType = 'WGS84' | 'GCJ02' | 'BD09'

/**
 * 坐标对象
 */
export interface Coord {
  latitude: number
  longitude: number
  coordType?: CoordType
}

function delta({ latitude, longitude }: Coord): Coord {
  // Krasovsky 1940
  //
  // a = 6378245.0, 1/f = 298.3
  // b = a * (1 - f)
  // ee = (a^2 - b^2) / a^2;
  const a = 6378245.0 //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
  const ee = 0.00669342162296594323 //  ee: 椭球的偏心率。
  let dLat = transformLat(longitude - 105.0, latitude - 35.0)
  let dLon = transformLon(longitude - 105.0, latitude - 35.0)
  const radLat = (latitude / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * PI)
  dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * PI)
  return { latitude: dLat, longitude: dLon }
}

/**
 * WGS84 -> BD09
 */
export function wgs2bd(position: Coord): Coord {
  const gcj = wgs2gcj(position)
  return gcj2bd(gcj)
}

/**
 * BD09 -> WGS84
 */
export function bd2wgs(position: Coord): Coord {
  const gcj = bd2gcj(position)
  return gcj2wgs(gcj)
}

/**
 * WGS84 -> GCJ02
 */
export function wgs2gcj({ longitude, latitude }: Coord): Coord {
  if (outOfChina({ latitude, longitude })) {
    return { latitude, longitude }
  }

  const d = delta({ latitude, longitude })
  return { latitude: latitude + d.latitude, longitude: longitude + d.longitude }
}

/**
 * GCJ-02 to WGS-84
 */
export function gcj2wgs({ latitude, longitude }: Coord): Coord {
  if (outOfChina({ latitude, longitude })) {
    return { latitude, longitude }
  }

  const d = delta({ latitude, longitude })
  return { latitude: latitude - d.latitude, longitude: longitude - d.longitude }
}

/**
 * GCJ-02 to WGS-84 exactly
 */
export function gcj2wgsExact({ latitude, longitude }: Coord): Coord {
  const initDelta = 0.01
  const threshold = 0.000000001
  let dLat = initDelta
  let dLon = initDelta
  let mLat = latitude - dLat
  let mLon = longitude - dLon
  let pLat = latitude + dLat
  let pLon = longitude + dLon
  let wgsLat: number = latitude
  let wgsLon: number = longitude
  let i = 0
  while (1) {
    wgsLat = (mLat + pLat) / 2
    wgsLon = (mLon + pLon) / 2
    const tmp = wgs2gcj({ latitude: wgsLat, longitude: wgsLon })
    dLat = tmp.latitude - latitude
    dLon = tmp.longitude - longitude
    if (Math.abs(dLat) < threshold && Math.abs(dLon) < threshold) {
      break
    }
    if (dLat > 0) {
      pLat = wgsLat
    } else {
      mLat = wgsLat
    }
    if (dLon > 0) {
      pLon = wgsLon
    } else {
      mLon = wgsLon
    }

    if (++i > 10000) {
      break
    }
  }
  return { latitude: wgsLat, longitude: wgsLon }
}

/**
 * GCJ-02 to BD-09
 */
export function gcj2bd({ latitude, longitude }: Coord): Coord {
  const x = longitude
  const y = latitude
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI)
  const bdLon = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return { latitude: bdLat, longitude: bdLon }
}

/**
 * BD-09 to GCJ-02
 */
export function bd2gcj({ latitude, longitude }: Coord): Coord {
  let x = longitude - 0.0065
  let y = latitude - 0.006
  let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  let gcjLon = z * Math.cos(theta)
  let gcjLat = z * Math.sin(theta)
  return { latitude: gcjLat, longitude: gcjLon }
}

// WGS-84 to Web mercator
// mercatorLat -> y mercatorLon -> x
export function mercatorEncrypt({ latitude, longitude }: Coord): Coord {
  let x = (longitude * 20037508.34) / 180
  let y = Math.log(Math.tan(((90 + latitude) * PI) / 360)) / (PI / 180)
  y = (y * 20037508.34) / 180
  return { latitude: y, longitude: x }
}

// Web mercator to WGS-84
// mercatorLat -> y mercatorLon -> x
export function mercatorDecrypt({ latitude, longitude }: Coord): Coord {
  let x = (longitude / 20037508.34) * 180
  let y = (latitude / 20037508.34) * 180
  y = (180 / PI) * (2 * Math.atan(Math.exp((y * PI) / 180)) - PI / 2)
  return { latitude: y, longitude: x }
}

export function identity(pos: Coord): Coord {
  return pos
}

// two point's distance
export function distance(
  { latitude: latA, longitude: lonA }: Coord,
  { latitude: latB, longitude: lonB }: Coord,
) {
  let earthR = 6371000
  let x =
    Math.cos((latA * PI) / 180) *
    Math.cos((latB * PI) / 180) *
    Math.cos(((lonA - lonB) * PI) / 180)
  let y = Math.sin((latA * PI) / 180) * Math.sin((latB * PI) / 180)
  let s = x + y
  if (s > 1) s = 1
  if (s < -1) s = -1
  let alpha = Math.acos(s)
  let distance = alpha * earthR
  return distance
}

/**
 * @param { latitude, longitude } 坐标轴
 */
export function outOfChina({ latitude, longitude }: Coord): boolean {
  if (longitude < 72.004 || longitude > 137.8347) return true
  if (latitude < 0.8293 || latitude > 55.8271) return true
  return false
}

function transformLat(x: number, y: number) {
  let ret =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x))
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0
  ret +=
    ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret +=
    ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) *
      2.0) /
    3.0
  return ret
}

function transformLon(x: number, y: number) {
  let ret =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x))
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0
  ret +=
    ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret +=
    ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) *
      2.0) /
    3.0
  return ret
}
