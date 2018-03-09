import {findInArray, isFunction, int} from '../shims';

export function getOffsetTop(node,parent){
  let offsetTop = 0
  while(node.offsetParent && node.offsetParent!==parent){
    offsetTop += node.offsetTop
    node = node.offsetParent
  }
  return offsetTop
}
export function getOffsetLeft(node,parent){
  let offsetLeft = 0
  while(node.offsetParent && node.offsetParent!==parent){
    offsetLeft += node.offsetLeft
    node = node.offsetParent
  }
  return offsetLeft
}

export function outerHeight(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height += int(computedStyle.borderTopWidth);
  height += int(computedStyle.borderBottomWidth);
  return height;
}

export function outerWidth(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetLeft which is including margin. See getBoundPosition
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width += int(computedStyle.borderLeftWidth);
  width += int(computedStyle.borderRightWidth);
  return width;
}
export function innerHeight(node: HTMLElement): number {
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height -= int(computedStyle.paddingTop);
  height -= int(computedStyle.paddingBottom);
  return height;
}
// export function viewWidth(node){
//   return innerWidth(node) - node.offsetLeft
// }
// export function viewHeight(node){
//   const winClientHeight = node.ownerDocument.clientHeight
//   const height = 0
//   if(outerHeight(node) > winClientHeight){
//    height = innerHeight(node)- outerHeight(node)+winClientHeight
//   }
//   else{
//     height = innerHeight(node) 
//   }
//   return outerHeight(node) - innerHeight(node) 
// }
// 436
export function innerWidth(node: HTMLElement): number {
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width -= int(computedStyle.paddingLeft);
  width -= int(computedStyle.paddingRight);
  return width;
}
