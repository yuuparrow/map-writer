export interface LatLng {
  lat: number;
  lng: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** GPS測位1回分 */
export interface Fix extends LatLng {
  accuracy: number;
  timestamp: number;
}

/** ナビ用に平坦化した経由点。penDown=false はこの点へ向かう区間がペンアップ(ストローク間移動) */
export interface NavPoint extends LatLng {
  penDown: boolean;
  strokeIdx: number;
}

/** 文字→ルート変換の結果 */
export interface RoutePlan {
  text: string;
  anchor: LatLng;
  sizeMeters: number;
  /** 幾何的な理想形状(ストロークごと) */
  ideal: LatLng[][];
  /** 道路スナップ済みポリライン(失敗ストロークは ideal と同一) */
  snapped: LatLng[][];
  /** ストロークごとのOSRM成否 */
  snapOk: boolean[];
  /** ナビ用平坦化経由点列 */
  navPoints: NavPoint[];
  /** ペンアップ区間込みの総距離 [m] */
  totalMeters: number;
  /** スナップ結果の理想形状からの平均乖離 [m] */
  deviationMeters: number;
}

export type AppMode = 'edit' | 'preview' | 'navigating' | 'done';
