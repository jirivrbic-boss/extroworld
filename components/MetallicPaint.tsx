'use client';

import { useEffect, useRef, useState } from 'react';

type MetallicParams = {
  patternScale?: number;
  refraction?: number;
  edge?: number;
  patternBlur?: number;
  liquid?: number;
  speed?: number;
};

const defaultParams: Required<MetallicParams> = {
  patternScale: 2,
  refraction: 0.015,
  edge: 1,
  patternBlur: 0.005,
  liquid: 0.07,
  speed: 0.3
};

export async function parseLogoImage(file: File): Promise<{ imageData: ImageData; pngBlob: Blob }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return await new Promise((resolve, reject) => {
    if (!file || !ctx) {
      reject(new Error('Invalid file or context'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const MAX_SIZE = 1000;
      const MIN_SIZE = 500;
      let width = img.naturalWidth || 1000;
      let height = img.naturalHeight || 1000;
      if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
        if (width > height) {
          const ratio = height / width;
          width = Math.min(Math.max(width, MIN_SIZE), MAX_SIZE);
          height = Math.round(width * ratio);
        } else {
          const ratio = width / height;
          height = Math.min(Math.max(height, MIN_SIZE), MAX_SIZE);
          width = Math.round(height * ratio);
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const src = ctx.getImageData(0, 0, width, height);
      const out = ctx.createImageData(width, height);
      // Treat ANY non-transparent pixel as shape (works for white PNG logos on transparent bg)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const a = src.data[i + 3];
          const isShape = a > 5;
          // Encode shape in red channel, white background elsewhere
          if (isShape) {
            // black shape mask → red=0 near edges will be computed by shader via gradients; keep black here
            out.data[i + 0] = 0;
            out.data[i + 1] = 0;
            out.data[i + 2] = 0;
            out.data[i + 3] = 255;
          } else {
            out.data[i + 0] = 255;
            out.data[i + 1] = 255;
            out.data[i + 2] = 255;
            out.data[i + 3] = 255;
          }
        }
      }
      ctx.putImageData(out, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }
        resolve({ imageData: out, pngBlob: blob });
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const vertexShaderSource = `#version 300 es
precision mediump float;
in vec2 a_position;
out vec2 vUv;
void main() {
  vUv = .5 * (a_position + 1.);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const liquidFragSource = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
  m = m*m;
  m = m*m;
  vec3 x = 2. * fract(p * C.www) - 1.;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130. * dot(m, g);
}
vec2 get_img_uv() {
  vec2 img_uv = vUv;
  img_uv -= .5;
  if (u_ratio > u_img_ratio) {
    img_uv.x = img_uv.x * u_ratio / u_img_ratio;
  } else {
    img_uv.y = img_uv.y * u_img_ratio / u_ratio;
  }
  float scale_factor = 1.;
  img_uv *= scale_factor;
  img_uv += .5;
  img_uv.y = 1. - img_uv.y;
  return img_uv;
}
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
  float ch = c2;
  float border = 0.;
  float blur = u_patternBlur + extra_blur;
  ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));
  border = w[0];
  ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
  b = smoothstep(.2, .8, b);
  border = w[0] + .4 * (1. - b) * w[1];
  ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
  border = w[0] + .5 * (1. - b) * w[1];
  ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
  border = w[0] + w[1];
  ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
  float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
  float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
  ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));
  return ch;
}
float get_img_frame_alpha(vec2 uv, float img_frame_width) {
  float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
  img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
  return img_frame_alpha;
}
void main() {
  vec2 uv = vUv;
  uv.y = 1. - uv.y;
  uv.x *= u_ratio;
  float diagonal = uv.x - uv.y;
  float t = .001 * u_time;
  vec2 img_uv = get_img_uv();
  vec4 img = texture(u_image_texture, img_uv);
  vec3 color = vec3(0.);
  float opacity = 1.;
  vec3 color1 = vec3(.98, 0.98, 1.);
  vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));
  float edge = img.r;
  vec2 grad_uv = uv;
  grad_uv -= .5;
  float dist = length(grad_uv + vec2(0., .2 * diagonal));
  grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);
  float bulge = pow(1.8 * dist, 1.2);
  bulge = 1. - bulge;
  bulge *= pow(uv.y, .3);
  float cycle_width = u_patternScale;
  float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
  float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
  float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);
  float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
  float thin_strip_2_width = cycle_width * thin_strip_2_ratio;
  opacity = 1. - smoothstep(.9 - .5 * u_edge, 1. - .5 * u_edge, edge);
  opacity *= get_img_frame_alpha(img_uv, 0.01);
  float noise = snoise(uv - t);
  edge += (1. - edge) * u_liquid * noise;
  float refr = 0.;
  refr += (1. - bulge);
  refr = clamp(refr, 0., 1.);
  float dir = grad_uv.x;
  dir += diagonal;
  dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));
  bulge *= clamp(pow(uv.y, .1), .3, 1.);
  dir *= (.1 + (1.1 - edge) * bulge);
  dir *= smoothstep(1., .7, edge);
  dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
  dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));
  dir *= (.5 + .5 * pow(uv.y, 2.));
  dir *= cycle_width;
  dir -= t;
  float refr_r = refr;
  refr_r += .03 * bulge * noise;
  float refr_b = 1.3 * refr;
  refr_r += 5. * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge));
  refr_r -= diagonal;
  refr_b += (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge));
  refr_b -= .2 * edge;
  refr_r *= u_refraction;
  refr_b *= u_refraction;
  vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
  w[1] -= .02 * smoothstep(.0, 1., edge + bulge);
  float stripe_r = mod(dir + refr_r, 1.);
  float r = get_color_channel(color1.r, color2.r, stripe_r, w, 0.02 + .03 * u_refraction * bulge, bulge);
  float stripe_g = mod(dir, 1.);
  float g = get_color_channel(color1.g, color2.g, stripe_g, w, 0.01 / (1. - diagonal), bulge);
  float stripe_b = mod(dir - refr_b, 1.);
  float b = get_color_channel(color1.b, color2.b, stripe_b, w, .01, bulge);
  color = vec3(r, g, b);
  color *= opacity;
  fragColor = vec4(color, opacity);
}
`;

export default function MetallicPaint({ imageData, params = defaultParams, fallbackSrc }: { imageData: ImageData | null; params?: MetallicParams; fallbackSrc?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gl, setGl] = useState<WebGL2RenderingContext | null>(null);
  const [uniforms, setUniforms] = useState<Record<string, WebGLUniformLocation | null>>({});
  const totalAnimationTime = useRef(0);
  const lastRenderTime = useRef(0);
  const [glUnavailable, setGlUnavailable] = useState(false);

  function updateUniforms() {
    if (!gl || !uniforms) return;
    gl.uniform1f(uniforms.u_edge, params.edge ?? defaultParams.edge);
    gl.uniform1f(uniforms.u_patternBlur, params.patternBlur ?? defaultParams.patternBlur);
    gl.uniform1f(uniforms.u_time, 0);
    gl.uniform1f(uniforms.u_patternScale, params.patternScale ?? defaultParams.patternScale);
    gl.uniform1f(uniforms.u_refraction, params.refraction ?? defaultParams.refraction);
    gl.uniform1f(uniforms.u_liquid, params.liquid ?? defaultParams.liquid);
  }

  useEffect(() => {
    function initShader() {
      const canvas = canvasRef.current;
      const ctx2 = canvas?.getContext('webgl2', { antialias: true, alpha: true });
      if (!canvas || !ctx2) {
        setGlUnavailable(true);
        return;
      }
      function createShader(gl: WebGL2RenderingContext, sourceCode: string, type: number) {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }
      const vertexShader = createShader(ctx2, vertexShaderSource, ctx2.VERTEX_SHADER);
      const fragmentShader = createShader(ctx2, liquidFragSource, ctx2.FRAGMENT_SHADER);
      const program = ctx2.createProgram();
      if (!program || !vertexShader || !fragmentShader) return;
      ctx2.attachShader(program, vertexShader);
      ctx2.attachShader(program, fragmentShader);
      ctx2.linkProgram(program);
      if (!ctx2.getProgramParameter(program, ctx2.LINK_STATUS)) {
        console.error('Program link error:', ctx2.getProgramInfoLog(program));
        return;
      }
      function getUniforms(program: WebGLProgram, glctx: WebGL2RenderingContext) {
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        const uniformCount = glctx.getProgramParameter(program, glctx.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const active = glctx.getActiveUniform(program, i);
          if (!active) continue;
          uniforms[active.name] = glctx.getUniformLocation(program, active.name);
        }
        return uniforms;
      }
      const uniforms = getUniforms(program, ctx2);
      setUniforms(uniforms);
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vertexBuffer = ctx2.createBuffer();
      ctx2.bindBuffer(ctx2.ARRAY_BUFFER, vertexBuffer);
      ctx2.bufferData(ctx2.ARRAY_BUFFER, vertices, ctx2.STATIC_DRAW);
      ctx2.useProgram(program);
      const positionLocation = ctx2.getAttribLocation(program, 'a_position');
      ctx2.enableVertexAttribArray(positionLocation);
      ctx2.bindBuffer(ctx2.ARRAY_BUFFER, vertexBuffer);
      ctx2.vertexAttribPointer(positionLocation, 2, ctx2.FLOAT, false, 0, 0);
      setGl(ctx2);
    }
    initShader();
    updateUniforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gl || !uniforms) return;
    updateUniforms();
  }, [gl, params, uniforms]);

  useEffect(() => {
    if (!gl || !uniforms) return;
    let renderId: number;
    const glCtx = gl; // non-null after guard
    const u = uniforms!;
    function render(currentTime: number) {
      const deltaTime = currentTime - lastRenderTime.current;
      lastRenderTime.current = currentTime;
      totalAnimationTime.current += deltaTime * (params.speed ?? defaultParams.speed);
      glCtx!.uniform1f(u.u_time!, totalAnimationTime.current);
      glCtx!.drawArrays(glCtx!.TRIANGLE_STRIP, 0, 4);
      renderId = requestAnimationFrame(render);
    }
    lastRenderTime.current = performance.now();
    renderId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(renderId);
  }, [gl, params.speed, uniforms]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !gl || !uniforms) return;
    const glCtx = gl; // capture non-null after guard
    const u = uniforms!;
    function resizeCanvas() {
      if (!canvasEl || !glCtx || !u || !imageData) return;
      const imgRatio = imageData.width / imageData.height;
      glCtx.uniform1f(u.u_img_ratio!, imgRatio);
      const side = 1000;
      canvasEl.width = side * devicePixelRatio;
      canvasEl.height = side * devicePixelRatio;
      glCtx.viewport(0, 0, canvasEl.width, canvasEl.height);
      glCtx.uniform1f(u.u_ratio!, 1);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [gl, uniforms, imageData]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!gl || !uniforms || !imageData) return;
    const glCtx = gl; // capture non-null
    const u = uniforms!;
    const img = imageData!;
    const existingTexture = glCtx.getParameter(glCtx.TEXTURE_BINDING_2D) as WebGLTexture | null;
    if (existingTexture) {
      glCtx.deleteTexture(existingTexture);
    }
    const imageTexture = glCtx.createTexture();
    glCtx.activeTexture(glCtx.TEXTURE0);
    glCtx.bindTexture(glCtx.TEXTURE_2D, imageTexture);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);
    glCtx.pixelStorei(glCtx.UNPACK_ALIGNMENT, 1);
    try {
      glCtx.texImage2D(
        glCtx.TEXTURE_2D,
        0,
        glCtx.RGBA,
        img.width as number,
        img.height as number,
        0,
        glCtx.RGBA,
        glCtx.UNSIGNED_BYTE,
        img.data as any
      );
      glCtx.uniform1i(u.u_image_texture!, 0);
    } catch (e) {
      console.error('Error uploading texture:', e);
    }
    return () => {
      if (imageTexture) glCtx.deleteTexture(imageTexture!);
    };
  }, [gl, uniforms, imageData]);

  if (glUnavailable || !imageData) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
        {fallbackSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fallbackSrc} alt="Extroworld logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        ) : null}
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid' }}>
      <style jsx global>{`
        .paint-container { display:block; width:100%; height:100%; object-fit:contain; }
      `}</style>
      <canvas ref={canvasRef} className="paint-container" />
    </div>
  );
}


