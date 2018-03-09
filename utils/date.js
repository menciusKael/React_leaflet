/**
 * 转换 日期字符串 到Date，例如20170801010000转换到Date()
 * @param {string} str 时间字符串
 * @return {Date}
 */
function parseDateString (str) {
  const year = String.prototype.substr.call(str, 0, 4)
  const month = String.prototype.substr.call(str, 4, 2) - 1 // Date 月份是从0开始的
  const day = String.prototype.substr.call(str, 6, 2)
  const hour = String.prototype.substr.call(str, 8, 2)
  const minute = String.prototype.substr.call(str, 10, 2)
  const secend = String.prototype.substr.call(str, 12, 2)
  const date = new Date(year, month, day, hour, minute, secend)
  return date
}
/**
 *
 * @param {*} date
 * @param {*} fmt
 */
function dateFormat (date, fmt) {
  var _this = new Date(date)
  var o = {
    'M+': _this.getMonth() + 1, // 月份
    'd+': _this.getDate(), // 日
    'h+': _this.getHours(), // 小时
    'm+': _this.getMinutes(), // 分
    's+': _this.getSeconds(), // 秒
    'q+': Math.floor((_this.getMonth() + 3) / 3), // 季度
    'S': _this.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (_this.getFullYear() + '').substr(4 - RegExp.$1.length))
  for (var k in o) { if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length))) }
  return fmt
}
export {parseDateString, dateFormat}
