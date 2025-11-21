/**
 * Adaptive Thresholds - 可根据实测性能调整
 *
 * 各个数据类型的最优阈值需要通过性能测试来确定
 */

/**
 * Array adaptive threshold
 * 实测结果：512 是 Array 的最优阈值
 */
export const ARRAY_ADAPTIVE_THRESHOLD = 512;

/**
 * Object adaptive threshold
 * TODO: 需要实测确定最优值
 */
export const OBJECT_ADAPTIVE_THRESHOLD = 512;

/**
 * Map adaptive threshold
 * TODO: 需要实测确定最优值
 */
export const MAP_ADAPTIVE_THRESHOLD = 512;

/**
 * Set adaptive threshold
 * TODO: 需要实测确定最优值
 */
export const SET_ADAPTIVE_THRESHOLD = 512;
