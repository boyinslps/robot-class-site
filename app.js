(function () {
  'use strict';

  // ---- 章節導覽：鍵盤 ← → 換頁、捲動時標示目前章節 ----
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
  var current = 0;

  function go(i) {
    i = Math.max(0, Math.min(sections.length - 1, i));
    sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(current - 1); }
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          current = sections.indexOf(en.target);
          links.forEach(function (a, k) { a.classList.toggle('active', k === current); });
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(function (s) { io.observe(s); });
  }

  // ---- 比賽目標影片：進到該頁才自動靜音播放，離開就停（學生不用操作）----
  var goal = document.getElementById('goal');
  var vids = Array.prototype.slice.call(goal.querySelectorAll('iframe[data-vid]'));
  function setVids(on) {
    vids.forEach(function (f) {
      var id = f.getAttribute('data-vid');
      f.src = on ? 'https://www.youtube.com/embed/' + id +
        '?autoplay=1&mute=1&loop=1&playlist=' + id + '&controls=0&modestbranding=1&rel=0&playsinline=1' : 'about:blank';
    });
  }
  if ('IntersectionObserver' in window) {
    var on = false;
    new IntersectionObserver(function (entries) {
      var v = entries[entries.length - 1].isIntersecting;
      if (v !== on) { on = v; setVids(v); }
    }, { threshold: 0.15 }).observe(goal);
  } else { setVids(true); }

  // ---- 計時器 ----
  var display = document.getElementById('timerDisplay');
  var toggle = document.getElementById('timerToggle');
  var reset = document.getElementById('timerReset');
  var total = 10 * 60;
  var left = total;
  var tick = null;

  function fmt(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function paint() { display.textContent = fmt(left); }
  function stop() { if (tick) { clearInterval(tick); tick = null; } toggle.textContent = '開始'; }
  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var o = ctx.createOscillator();
      o.frequency.value = 880; o.connect(ctx.destination); o.start();
      setTimeout(function () { o.stop(); ctx.close(); }, 600);
    } catch (e) { /* 沒有聲音也沒關係 */ }
  }

  document.querySelectorAll('[data-set]').forEach(function (b) {
    b.addEventListener('click', function () {
      stop();
      total = left = parseInt(b.getAttribute('data-set'), 10) * 60;
      paint();
    });
  });
  toggle.addEventListener('click', function () {
    if (tick) { stop(); return; }
    if (left <= 0) left = total;
    toggle.textContent = '暫停';
    tick = setInterval(function () {
      left -= 1; paint();
      if (left <= 0) { stop(); beep(); }
    }, 1000);
  });
  reset.addEventListener('click', function () { stop(); left = total; paint(); });
  paint();

  // ---- 分隊抽籤（名單只留在記憶體，不儲存、不上傳）----
  var names = document.getElementById('names');
  var result = document.getElementById('teamResult');

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  document.getElementById('splitBtn').addEventListener('click', function () {
    var list = names.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    result.textContent = '';
    if (list.length < 2) {
      var p = document.createElement('p');
      p.className = 'small';
      p.textContent = '至少要輸入 2 個名字。';
      result.appendChild(p);
      return;
    }
    shuffle(list);
    var half = Math.ceil(list.length / 2);
    [list.slice(0, half), list.slice(half)].forEach(function (team, k) {
      var box = document.createElement('div');
      box.className = 'team-box';
      var h = document.createElement('h4');
      h.textContent = '第 ' + (k + 1) + ' 隊（' + team.length + ' 人）';
      var ul = document.createElement('ul');
      team.forEach(function (n) {
        var li = document.createElement('li');
        li.textContent = n;
        ul.appendChild(li);
      });
      box.appendChild(h); box.appendChild(ul);
      result.appendChild(box);
    });
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    names.value = ''; result.textContent = '';
  });
})();
