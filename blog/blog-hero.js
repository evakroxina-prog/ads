/* Blog hero — WebGL wave on cover image (fallback: static background) */
(function () {
  "use strict";

  var HERO_IMAGES = ["/blog/hero.webp", "/blog/hero.jpg", "/blog/hero.png"];
  var bg = document.getElementById("fixed-bg");
  var canvas = document.getElementById("hero-canvas");
  if (!bg || !canvas) return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    setStaticBg(HERO_IMAGES[0]);
    return;
  }

  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) {
    setStaticBg(HERO_IMAGES[0]);
    return;
  }

  var vsSource =
    "attribute vec2 a_pos;" +
    "varying vec2 v_uv;" +
    "void main(){v_uv=a_pos*0.5+0.5;gl_Position=vec4(a_pos,0.0,1.0);}";

  var fsSource =
    "precision mediump float;" +
    "uniform sampler2D u_tex;" +
    "uniform vec2 u_res;" +
    "uniform vec2 u_img;" +
    "uniform float u_time;" +
    "uniform vec2 u_mouse;" +
    "varying vec2 v_uv;" +
    "vec2 coverUV(vec2 uv){float sa=u_res.x/u_res.y;float ia=u_img.x/u_img.y;vec2 s=vec2(1.0);if(sa>ia)s.y=ia/sa;else s.x=sa/ia;return (uv-0.5)*s+0.5;}" +
    "void main(){vec2 uv=coverUV(v_uv);float t=u_time;" +
    "float w=sin(uv.y*9.0+t*0.75)*0.006+sin(uv.x*7.0+t*0.55)*0.005;" +
    "w+=sin((uv.x+uv.y)*11.0+t*0.35)*0.003;" +
    "vec2 m=(u_mouse-0.5)*0.02;uv+=vec2(w,m.x*sin(uv.y*12.0+t));" +
    "gl_FragColor=texture2D(u_tex,uv);}";

  var program = createProgram(gl, vsSource, fsSource);
  if (!program) {
    setStaticBg(HERO_IMAGES[0]);
    return;
  }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(program, "a_pos");
  var uTex = gl.getUniformLocation(program, "u_tex");
  var uRes = gl.getUniformLocation(program, "u_res");
  var uImg = gl.getUniformLocation(program, "u_img");
  var uTime = gl.getUniformLocation(program, "u_time");
  var uMouse = gl.getUniformLocation(program, "u_mouse");

  var texture = gl.createTexture();
  var imgSize = [1, 1];
  var mouse = [0.5, 0.5];
  var targetMouse = [0.5, 0.5];
  var start = performance.now();
  var loaded = false;

  bg.addEventListener("pointermove", function (e) {
    var r = bg.getBoundingClientRect();
    targetMouse[0] = (e.clientX - r.left) / r.width;
    targetMouse[1] = 1.0 - (e.clientY - r.top) / r.height;
  }, { passive: true });

  bg.addEventListener("pointerleave", function () {
    targetMouse[0] = 0.5;
    targetMouse[1] = 0.5;
  });

  loadImage(0, function (img) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    imgSize[0] = img.naturalWidth;
    imgSize[1] = img.naturalHeight;
    loaded = true;
    resize();
    requestAnimationFrame(tick);
  });

  window.addEventListener("resize", resize, { passive: true });

  function tick(now) {
    if (!loaded) return;
    mouse[0] += (targetMouse[0] - mouse[0]) * 0.06;
    mouse[1] += (targetMouse[1] - mouse[1]) * 0.06;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uTex, 0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uImg, imgSize[0], imgSize[1]);
    gl.uniform1f(uTime, (now - start) * 0.001);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.enableVertexAttribArray(aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(tick);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = bg.getBoundingClientRect();
    var w = Math.max(Math.round(rect.width * dpr), 1);
    var h = Math.max(Math.round(rect.height * dpr), 1);
    canvas.width = w;
    canvas.height = h;
  }

  function loadImage(i, cb) {
    if (i >= HERO_IMAGES.length) {
      setStaticBg(HERO_IMAGES[0]);
      return;
    }
    var img = new Image();
    img.decoding = "async";
    img.onload = function () { cb(img); };
    img.onerror = function () { loadImage(i + 1, cb); };
    img.src = HERO_IMAGES[i];
  }

  function setStaticBg(url) {
    bg.classList.add("hero-bg--static");
    bg.style.backgroundImage = "url('" + url + "')";
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  function createProgram(glCtx, vs, fs) {
    var p = glCtx.createProgram();
    var vsh = compile(glCtx, glCtx.VERTEX_SHADER, vs);
    var fsh = compile(glCtx, glCtx.FRAGMENT_SHADER, fs);
    if (!vsh || !fsh) return null;
    glCtx.attachShader(p, vsh);
    glCtx.attachShader(p, fsh);
    glCtx.linkProgram(p);
    if (!glCtx.getProgramParameter(p, glCtx.LINK_STATUS)) return null;
    return p;
  }

  function compile(glCtx, type, src) {
    var s = glCtx.createShader(type);
    glCtx.shaderSource(s, src);
    glCtx.compileShader(s);
    if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) return null;
    return s;
  }
})();
