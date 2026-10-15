/* stats.js — 访问统计 (前端 ping 后端) */
(function() {
  // 发送 PV
  const data = {
    path: location.pathname + location.hash,
    referrer: document.referrer || 'direct',
    ua: navigator.userAgent,
    lang: navigator.language,
    screen: screen.width + 'x' + screen.height,
    ts: Date.now(),
  };

  // 1x1 pixel ping (零依赖) - 路径在 Caddyfile 反代
  try {
    const url = '/stats/record?d=' + encodeURIComponent(JSON.stringify(data));
    fetch(url, { method: 'GET', cache: 'no-store' }).catch(() => {});
  } catch (e) {}

  // 数字滚动动效
  function animateNumber(el, target) {
    if (!el || isNaN(target)) return;
    let current = 0;
    const step = Math.max(1, target / 30);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString();
    }, 25);
  }

  window.animateNumber = animateNumber;
})();
