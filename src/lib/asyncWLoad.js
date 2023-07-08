export const asyncWLoad = new Promise(r => {
  window.onload = () => r(true);
});